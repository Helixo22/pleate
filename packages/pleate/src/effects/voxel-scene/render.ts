// How voxels are drawn. The scene renders into a tiny target, one pixel of the target per large pixel on screen, with a
// material that lights in a few dithered bands. Then a full screen pass scales it up with hard edges and adds the dark
// contour and the disc behind. Colors stay in display space the whole way, so a palette color comes out as itself.
import {
  Box3,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  DepthTexture,
  DoubleSide,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  NearestFilter,
  NoBlending,
  NoColorSpace,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  UnsignedIntType,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  type PerspectiveCamera,
  type Scene,
  type WebGLRenderer,
} from "three";
import { meshVolume } from "./mesher.ts";
import type { VoxelModel } from "./volume.ts";

export type Rgb = readonly [number, number, number];
export type Resolve = (color: string) => Rgb;

const BAYER = /* glsl */ `
  float bayer(vec2 p) {
    vec2 q = floor(mod(p, 4.0));
    float i = q.x + q.y * 4.0;
    int n = int(i);
    int row0[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
    return (float(row0[n]) + 0.5) / 16.0;
  }
`;

export type VoxelLook = {
  /** Steps of light on the surfaces. */
  bands: number;
  /** Softness between the steps, 0 (hard) to 1. */
  dither: number;
  /** How much the single voxels differ in tone, 0 to 1. */
  grain: number;
  /** Where the light comes from. */
  light: readonly [number, number, number];
};

export function createVoxelMaterial(look: VoxelLook, instanced = false) {
  return new ShaderMaterial({
    vertexColors: !instanced,
    side: DoubleSide,
    uniforms: {
      uLight: { value: new Vector3(...look.light).normalize() },
      uBands: { value: look.bands },
      uDither: { value: look.dither },
      uGrain: { value: look.grain },
      uBuild: { value: 1e6 },
    },
    vertexShader: /* glsl */ `
      ${instanced ? "" : "attribute float shade;"}
      varying vec3 vColor;
      varying vec3 vNormal2;
      varying vec3 vFace;
      varying vec3 vLocal;
      varying float vShade;
      void main() {
        mat4 m = modelMatrix;
        #ifdef USE_INSTANCING
          m = modelMatrix * instanceMatrix;
        #endif
        #ifdef USE_INSTANCING_COLOR
          vColor = instanceColor;
        #else
          vColor = ${instanced ? "vec3(1.0)" : "color"};
        #endif
        vShade = ${instanced ? "1.0" : "shade"};
        vNormal2 = normalize(mat3(m) * normal);
        vFace = normal;
        vLocal = position;
        gl_Position = projectionMatrix * viewMatrix * m * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uLight;
      uniform float uBands, uDither, uGrain, uBuild;
      varying vec3 vColor;
      varying vec3 vNormal2;
      varying vec3 vFace;
      varying vec3 vLocal;
      varying float vShade;
      ${BAYER}
      float rand(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      void main() {
        vec3 cell = floor(vLocal - vFace * 0.5 + 0.001);
        float r = rand(cell);
        // Building: the voxels under the line are there, the ones near it drop in at random.
        if (cell.y + r * 3.0 > uBuild) discard;
        vec3 n = normalize(gl_FrontFacing ? vNormal2 : -vNormal2);
        float light = dot(n, uLight) * 0.5 + 0.5;
        light = light * mix(0.62, 1.0, vShade) * (gl_FrontFacing ? 1.0 : 0.5);
        light += (r - 0.5) * 0.22 * uGrain;
        float step0 = floor(clamp(light, 0.0, 0.999) * uBands + (bayer(gl_FragCoord.xy) - 0.5) * uDither);
        float t = clamp(step0 / max(1.0, uBands - 1.0), 0.0, 1.0);
        // Dark tones lean to violet and bright ones to a warm white, as in hand drawn ramps.
        vec3 dark = vColor * vec3(0.42, 0.36, 0.5) + vec3(0.02, 0.0, 0.04);
        vec3 bright = mix(vColor, vec3(1.0, 0.98, 0.9), 0.22);
        vec3 c = t < 0.6 ? mix(dark, vColor, t / 0.6) : mix(vColor, bright, (t - 0.6) / 0.4);
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
}

/* ------------------------------------------------------------------------------------------------ Actors */

export type VoxelActor = {
  /** Move, turn and scale the whole model with this. */
  group: Group;
  /** The parts by id, to move or turn one of them. explode() writes their position. */
  parts: Record<string, Group>;
  /** Size in scene units, as built. */
  size: Vector3;
  /** 0 is whole, 1 is apart: every part goes its own `away`. */
  explode: (t: number) => void;
  /** 0 is nothing, 1 is whole: the voxels land from the ground up. */
  build: (t: number) => void;
  /** Reads the colors again after a theme change. */
  recolor: (resolve: Resolve) => void;
};

/** Meshes a model. Its largest side becomes `size` scene units. */
export function createActor(model: VoxelModel, look: VoxelLook, resolve: Resolve, size = 2): VoxelActor {
  const group = new Group();
  const inner = new Group();
  group.add(inner);
  const parts: Record<string, Group> = {};
  const recolors: ((resolve: Resolve) => void)[] = [];
  const materials: { material: ShaderMaterial; from: number; height: number }[] = [];
  let top = 1;

  for (const part of model.parts) {
    const volume = part.volume();
    const data = meshVolume(volume);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(data.positions, 3));
    geometry.setAttribute("normal", new BufferAttribute(data.normals, 3, true));
    geometry.setAttribute("shade", new BufferAttribute(data.shade, 1, true));
    const colors = new BufferAttribute(new Uint8Array(data.inks.length * 3), 3, true);
    geometry.setAttribute("color", colors);
    geometry.setIndex(new BufferAttribute(data.indices, 1));
    recolors.push((read) => {
      const table = volume.palette.map(read);
      data.inks.forEach((ink, i) => {
        const [r, g, b] = table[ink - 1];
        colors.setXYZ(i, r, g, b);
      });
      colors.needsUpdate = true;
    });
    const material = createVoxelMaterial(look);
    const holder = new Group();
    holder.add(new Mesh(geometry, material));
    const [x, y, z] = part.at ?? [0, 0, 0];
    holder.position.set(x, y, z);
    inner.add(holder);
    parts[part.id] = holder;
    materials.push({ material, from: y, height: volume.height });
    top = Math.max(top, y + volume.height);
  }
  for (const recolor of recolors) recolor(resolve);

  const bounds = new Box3().setFromObject(inner).getSize(new Vector3());
  const unit = size / Math.max(bounds.x, bounds.y, bounds.z, 1);
  inner.scale.setScalar(unit);

  return {
    group,
    parts,
    size: bounds.multiplyScalar(unit),
    explode(t) {
      for (const part of model.parts) {
        const [x, y, z] = part.at ?? [0, 0, 0];
        const [ax, ay, az] = part.away ?? [0, 0, 0];
        parts[part.id].position.set(x + ax * t, y + ay * t, z + az * t);
      }
    },
    build(t) {
      for (const { material, from } of materials) material.uniforms.uBuild.value = t >= 1 ? 1e6 : t * (top + 3) - from;
    },
    recolor: (read) => recolors.forEach((recolor) => recolor(read)),
  };
}

/* ------------------------------------------------------------------------------------------------ Burst */

export type BurstOptions = {
  count?: number;
  colors?: readonly string[];
  /** Side of one cube, in scene units. */
  cube?: number;
  /** How far the cubes fly. */
  spread?: number;
  /** How far they fall back. */
  gravity?: number;
  seed?: number;
};

export type VoxelBurst = {
  mesh: InstancedMesh;
  /** 0 is not yet, 1 is gone. The same t always gives the same picture, so it can follow the scroll. */
  set: (t: number) => void;
};

export function createBurst(look: VoxelLook, resolve: Resolve, options: BurstOptions = {}): VoxelBurst {
  const { count = 36, colors = ["var(--pl-fg)"], cube = 0.08, spread = 1.6, gravity = 1.4, seed = 1 } = options;
  const mesh = new InstancedMesh(new BoxGeometry(cube, cube, cube), createVoxelMaterial(look, true), count);
  mesh.frustumCulled = false;
  const tints = new Float32Array(count * 3);
  let s = seed * 9301 + 49297;
  const random = () => ((s = (s * 16807) % 2147483647) & 0xfffffff) / 0xfffffff;
  const flights = Array.from({ length: count }, (_, i) => {
    tints.set(resolve(colors[i % colors.length]), i * 3);
    const a = random() * Math.PI * 2;
    const up = 0.25 + random() * 0.9;
    const reach = 0.5 + random() * 0.5;
    return { dir: new Vector3(Math.cos(a) * reach, up, Math.sin(a) * reach), turn: random() * 6, axis: new Vector3(random(), random(), random()).normalize(), size: 0.5 + random() };
  });
  mesh.instanceColor = new InstancedBufferAttribute(tints, 3);
  const m = new Matrix4();
  const p = new Vector3();
  const q = new Quaternion();
  const k = new Vector3();
  const set = (t: number) => {
    mesh.visible = t > 0 && t < 1;
    if (!mesh.visible) return;
    flights.forEach((f, i) => {
      p.copy(f.dir).multiplyScalar(spread * t);
      p.y -= gravity * t * t;
      q.setFromAxisAngle(f.axis, f.turn * t);
      k.setScalar(f.size * Math.min(1, (1 - t) * 2.5));
      mesh.setMatrixAt(i, m.compose(p, q, k));
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  set(0);
  return { mesh, set };
}

/* ------------------------------------------------------------------------------------------------ Ground shadow */

/** A round dithered shadow to lay under a model. */
export function createGroundShadow(radius: number) {
  const mesh = new Mesh(
    new CircleGeometry(radius, 48),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: `varying vec2 vUv2; void main() { vUv2 = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        varying vec2 vUv2;
        ${BAYER}
        void main() {
          if (bayer(gl_FragCoord.xy) > (1.0 - length(vUv2)) * 1.1) discard;
          gl_FragColor = vec4(0.1, 0.05, 0.09, 1.0);
        }
      `,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

/* ------------------------------------------------------------------------------------------------ Pixel pass */

export type DiscLook = {
  color: Rgb;
  /** Radius as a share of the shorter side of the canvas. */
  radius: number;
  /** Center of the disc and of the picture, 0..1 from the left and from the top. */
  center: readonly [number, number];
};

export class PixelPass {
  readonly target = new WebGLRenderTarget(1, 1, { minFilter: NearestFilter, magFilter: NearestFilter, colorSpace: NoColorSpace });
  readonly quad: Mesh<PlaneGeometry, ShaderMaterial>;
  private size = new Vector2();

  constructor(outline: Rgb | null) {
    this.target.depthTexture = new DepthTexture(1, 1, UnsignedIntType);
    this.quad = new Mesh(
      new PlaneGeometry(2, 2),
      new ShaderMaterial({
        depthTest: false,
        depthWrite: false,
        blending: NoBlending,
        uniforms: {
          tColor: { value: this.target.texture },
          tDepth: { value: this.target.depthTexture },
          uCell: { value: 4 },
          uSize: { value: new Vector2(1, 1) },
          uNear: { value: 0.1 },
          uFar: { value: 100 },
          uOutline: { value: new Vector3(...(outline ?? [0, 0, 0])) },
          uOutlined: { value: outline ? 1 : 0 },
          uDisc: { value: new Vector3() },
          uDiscRadius: { value: 0 },
          uDiscCenter: { value: new Vector2(0.5, 0.5) },
        },
        vertexShader: `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D tColor;
          uniform highp sampler2D tDepth;
          uniform float uCell, uNear, uFar, uOutlined, uDiscRadius;
          uniform vec2 uSize, uDiscCenter;
          uniform vec3 uOutline, uDisc;
          ${BAYER}
          float depthAt(ivec2 p) {
            if (p.x < 0 || p.y < 0 || p.x >= int(uSize.x) || p.y >= int(uSize.y)) return uFar * 2.0;
            float d = texelFetch(tDepth, p, 0).x;
            return d >= 1.0 ? uFar * 2.0 : uNear * uFar / (uFar - d * (uFar - uNear));
          }
          // How much nearer one neighbour is, minus the slope the surface already has on the other side.
          float jump(float d, float near, float other) {
            return d - near - (other > uFar ? 0.0 : max(0.0, other - d));
          }
          void main() {
            vec2 cell = floor(gl_FragCoord.xy / uCell);
            ivec2 p = ivec2(cell);
            vec4 c = texelFetch(tColor, p, 0);
            float d = depthAt(p);
            float l = depthAt(p - ivec2(1, 0)), r = depthAt(p + ivec2(1, 0));
            float b = depthAt(p - ivec2(0, 1)), t = depthAt(p + ivec2(0, 1));
            bool empty = d > uFar;
            // A pinhole between two merged rectangles shows the far side of the model: it takes its neighbour's place.
            if (!empty && d - max(l, r) > 0.02 * d) { gl_FragColor = vec4(texelFetch(tColor, p - ivec2(1, 0), 0).rgb, 1.0); return; }
            if (!empty && d - max(b, t) > 0.02 * d) { gl_FragColor = vec4(texelFetch(tColor, p - ivec2(0, 1), 0).rgb, 1.0); return; }
            if (uOutlined > 0.5) {
              if (empty && min(min(l, r), min(b, t)) <= uFar) { gl_FragColor = vec4(uOutline, 1.0); return; }
              // Where one thing passes in front of another, the one behind gets the line.
              if (!empty && max(max(jump(d, l, r), jump(d, r, l)), max(jump(d, b, t), jump(d, t, b))) > 0.012 * d + 0.05) { gl_FragColor = vec4(mix(c.rgb, uOutline, 0.8), 1.0); return; }
            }
            if (c.a > 0.5) { gl_FragColor = vec4(c.rgb, 1.0); return; }
            if (uDiscRadius > 0.0) {
              vec2 v = cell - floor(uDiscCenter * uSize);
              float radius = floor(uDiscRadius * min(uSize.x, uSize.y));
              if (dot(v, v) < radius * radius) {
                float tilt = 0.5 + dot(v, vec2(0.7071, -0.7071)) / (2.0 * radius);
                float tone = floor(tilt * 3.0 + (bayer(cell) - 0.5) * 0.45);
                vec3 disc = tone < 1.0 ? mix(uDisc, vec3(1.0, 0.95, 0.8), 0.2) : tone < 2.0 ? uDisc : uDisc * vec3(0.86, 0.8, 0.84);
                gl_FragColor = vec4(disc, 1.0);
                return;
              }
            }
            gl_FragColor = vec4(0.0);
          }
        `,
      }),
    );
    this.quad.frustumCulled = false;
  }

  disc(look: DiscLook | null) {
    const u = this.quad.material.uniforms;
    u.uDiscRadius.value = look?.radius ?? 0;
    if (!look) return;
    u.uDisc.value.set(...look.color);
    u.uDiscCenter.value.set(look.center[0], 1 - look.center[1]);
  }

  outline(color: Rgb | null) {
    const u = this.quad.material.uniforms;
    u.uOutlined.value = color ? 1 : 0;
    if (color) u.uOutline.value.set(...color);
  }

  /**
   * Draws the stage into the small target. `pixel` is the side of one large pixel, in CSS pixels, and `center` is where
   * the middle of the picture goes.
   */
  render(renderer: WebGLRenderer, stage: Scene, camera: PerspectiveCamera, pixel: number, center: readonly [number, number]) {
    const cell = Math.max(1, Math.round(pixel * renderer.getPixelRatio()));
    renderer.getDrawingBufferSize(this.size);
    const w = Math.max(1, Math.ceil(this.size.x / cell));
    const h = Math.max(1, Math.ceil(this.size.y / cell));
    if (this.target.width !== w || this.target.height !== h) this.target.setSize(w, h);
    const u = this.quad.material.uniforms;
    u.uCell.value = cell;
    u.uSize.value.set(w, h);
    u.uNear.value = camera.near;
    u.uFar.value = camera.far;
    // Moves the picture over the canvas without turning the camera, so the models keep their shape and their angle.
    camera.setViewOffset(w, h, (0.5 - center[0]) * w, (0.5 - center[1]) * h, w, h);
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(stage, camera);
    renderer.setRenderTarget(null);
  }

  dispose() {
    this.target.depthTexture?.dispose();
    this.target.dispose();
  }
}
