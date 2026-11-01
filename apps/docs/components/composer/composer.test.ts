// Self-check for the composer's pure parts. Run: node --test apps/docs/components/composer/composer.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { attr, demoFile, generatePage, generateProject, text } from "./codegen.ts";
import { backgrounds, demoKeys } from "./gen-loaders.mjs";
import { BACKGROUND_LOADERS, DEMO_LOADERS } from "./loaders.ts";
import { HISTORY_LIMIT, historyReducer, initHistory } from "./history.ts";
import { componentBlock, componentFields, createBlock, defaultProject, LIBRARY, sanitizeProject } from "./model.ts";

test("history: set, undo, redo, merge and cap", () => {
  let h = initHistory(0);
  h = historyReducer(h, { type: "set", value: 1 });
  h = historyReducer(h, { type: "set", value: 2 });
  h = historyReducer(h, { type: "undo" });
  assert.equal(h.present, 1);
  h = historyReducer(h, { type: "redo" });
  assert.equal(h.present, 2);
  h = historyReducer(h, { type: "undo" });
  h = historyReducer(h, { type: "set", value: 5 });
  assert.deepEqual(h.future, [], "a new edit drops the redo stack");
  assert.equal(historyReducer(initHistory(0), { type: "undo" }).present, 0, "undo on empty is a no-op");

  // Typing in one field merges into one step.
  h = initHistory(0);
  for (let i = 1; i <= 5; i++) h = historyReducer(h, { type: "set", value: i, merge: "title" });
  assert.equal(h.past.length, 1);
  h = historyReducer(h, { type: "undo" });
  assert.equal(h.present, 0);

  h = initHistory(0);
  for (let i = 1; i <= HISTORY_LIMIT + 20; i++) h = historyReducer(h, { type: "set", value: i });
  assert.equal(h.past.length, HISTORY_LIMIT);
});

test("codegen: attributes and text are escaped", () => {
  assert.equal(attr("title", "Hello"), 'title="Hello"');
  assert.equal(attr("title", 'Say "hi" {x}'), 'title={"Say \\"hi\\" {x}"}');
  assert.equal(attr("open", true), "open");
  assert.equal(attr("open", false), null);
  assert.equal(attr("title", ""), null);
  assert.equal(text("Plain"), "Plain");
  assert.equal(text("<script>"), '{"<script>"}');
  assert.equal(text("it's"), `{"it's"}`);
});

test("codegen: a page with every section imports from pleate subpaths", () => {
  const page = { id: "p", name: "About us", blocks: LIBRARY.map((l) => createBlock(l)) };
  const theme = { palette: "teal", custom: "#ff2d55", mode: "dark" as const, roundness: 1 };
  const code = generatePage(page, theme);
  assert.match(code, /^"use client";/);
  assert.match(code, /export default function AboutUsPage\(\)/);
  assert.match(code, /import \{ Hero \} from "pleate\/marketing\/hero";/);
  assert.match(code, /import \{ Accordion, AccordionContent, AccordionItem, AccordionTrigger \} from "pleate\/accordion";/);
  assert.match(code, /data-palette="teal"/);
  assert.match(code, /"--pl-roundness": 1/);
  for (const line of code.split("\n").filter((l) => l.startsWith("import"))) assert.match(line, /from "(pleate\/[a-z/-]+|lucide-react|react)";$/);
  // Balanced braces and tags are a cheap proxy for valid JSX.
  assert.equal((code.match(/\{/g) ?? []).length, (code.match(/\}/g) ?? []).length);
  assert.equal((code.match(/<Section\b/g) ?? []).length, (code.match(/<\/Section>/g) ?? []).length);

  const custom = generatePage(page, { ...theme, palette: "custom", roundness: 1.5 });
  assert.match(custom, /paletteStyle\(createPalette\("#ff2d55"\), "dark"\)/);
  assert.doesNotMatch(custom, /data-palette/);
});

test("codegen: one file per page, unique paths", () => {
  const p = defaultProject();
  p.pages.push({ id: "a", name: "Pricing", blocks: [] }, { id: "b", name: "Pricing", blocks: [] });
  assert.deepEqual(Object.keys(generateProject(p)), ["app/page.tsx", "app/pricing/page.tsx", "app/pricing-2/page.tsx"]);
});

test("sanitize: rejects junk, drops unknown sections, coerces props", () => {
  assert.equal(sanitizeProject(null), null);
  assert.equal(sanitizeProject({ pages: [] }), null);
  const p = sanitizeProject({
    theme: { palette: "nope", mode: "light", roundness: 99 },
    pages: [{ name: "Home", blocks: [{ type: "evil" }, { type: "hero", props: { title: 42, layout: "split", extra: "x" } }] }],
  });
  assert.ok(p);
  assert.equal(p.theme.palette, "blue");
  assert.equal(p.theme.roundness, 3);
  assert.equal(p.pages[0].blocks.length, 1);
  assert.equal(p.pages[0].blocks[0].props.layout, "split");
  assert.equal(typeof p.pages[0].blocks[0].props.title, "string");
  assert.equal("extra" in p.pages[0].blocks[0].props, false);
});

test("codegen: component blocks import their demo file, or the effect when used as a background", () => {
  const theme = { palette: "blue", custom: "#ff2d55", mode: "light" as const, roundness: 1.5 };
  const demo = componentBlock("split-text", "basic", false);
  demo.props.heading = "Kinetic type";
  const bg = componentBlock("aurora", "basic", true);
  const project = { ...defaultProject(), pages: [{ id: "h", name: "Home", blocks: [demo, bg] }] };
  const ctx = { backgrounds: { aurora: { name: "Aurora", path: "pleate/effects/aurora" } }, sources: { "split-text/basic": "export default function Demo() {}\n" } };
  const files = generateProject(project, ctx);
  assert.deepEqual(Object.keys(files), ["app/page.tsx", "components/split-text-basic.tsx"]);
  assert.equal(files["components/split-text-basic.tsx"], ctx.sources["split-text/basic"], "demo exported verbatim");
  const page = files["app/page.tsx"];
  assert.match(page, /import SplitTextBasic from "@\/components\/split-text-basic";/);
  assert.match(page, /<SplitTextBasic \/>/);
  assert.match(page, /title="Kinetic type"/);
  assert.match(page, /import \{ Aurora \} from "pleate\/effects\/aurora";/);
  assert.match(page, /<Aurora className="absolute inset-0 -z-10" \/>/);
  assert.match(page, /minHeight: 560/);
  assert.equal(demoFile("3d-effects", "tilt").name, "C3dEffectsTilt");
  // Without background info the block falls back to its demo.
  assert.ok(Object.keys(generateProject(project, {})).includes("components/aurora-basic.tsx"));
});

test("model: component fields follow the background switch", () => {
  const keys = (bg: boolean, can: boolean) => componentFields({ asBackground: bg }, can).map((f) => f.key);
  assert.ok(keys(true, true).includes("primary") && !keys(true, true).includes("width"));
  assert.ok(keys(false, true).includes("width") && keys(false, true).includes("asBackground"));
  assert.ok(!keys(true, false).includes("asBackground") && keys(true, false).includes("width"));
});

test("sanitize: component blocks need a known slug; a bad demo falls back to the first", () => {
  const raw = (slug: string, demo: string) => ({ pages: [{ name: "Home", blocks: [{ type: "component", props: { slug, demo } }] }] });
  const index = { aurora: ["basic", "dense"] };
  assert.equal(sanitizeProject(raw("nope", "basic"), index)!.pages[0].blocks.length, 0, "unknown slug dropped");
  assert.equal(sanitizeProject(raw("aurora", "missing"), index)!.pages[0].blocks[0].props.demo, "basic");
  assert.equal(sanitizeProject(raw("../etc", "basic"))!.pages[0].blocks.length, 0, "malformed slug dropped without an index");
  // Old projects (no component blocks) still load unchanged.
  const old = defaultProject();
  assert.deepEqual(sanitizeProject(JSON.parse(JSON.stringify(old)), index), old);
});

test("loaders.ts is in sync with demos/ (rerun gen-loaders.mjs if this fails)", () => {
  assert.deepEqual(Object.keys(DEMO_LOADERS).sort(), demoKeys());
  assert.deepEqual(Object.keys(BACKGROUND_LOADERS).sort(), backgrounds().map((b) => b.slug));
});
