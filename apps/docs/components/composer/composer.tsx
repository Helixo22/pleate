// pleate UI Composer: build pages from ready sections. Library on the left (drag or press to add), live canvas in the
// middle with its own theme and device width, props of the selected section on the right. Multi page, undo / redo,
// saved in localStorage, JSON import / export and TSX export. Phones get a note and a read-only preview.
"use client";

import { ArrowLeft, Check, Code, Download, FileText, Monitor, Plus, Redo2, Smartphone, Tablet, Trash2, Undo2, Upload } from "lucide-react";
import Link from "next/link";
import {
  Button,
  cn,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  SegmentedControl,
  SidebarGroup,
  SidebarItem,
  Slider,
  Snippet,
} from "pleate";
import { useMediaQuery } from "pleate/lib";
import { createPalette, PALETTES } from "pleate/theme";
import { toast } from "pleate/toast";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { DEVICE_WIDTH, DRAG_TYPE, themeProps, type Device, type DragPayload } from "./canvas";
import { ComponentLibrary } from "./component-library";
import { demoKeysOf, generateProject, type CodegenContext } from "./codegen";
import { canBackground } from "./component-view";
import { FrameHost } from "./frame";
import { historyReducer, initHistory } from "./history";
import { Inspector, move } from "./inspector";
import {
  componentBlock,
  componentFields,
  createBlock,
  defaultProject,
  LIBRARY,
  sanitizeProject,
  SECTIONS,
  slugify,
  uid,
  type Block,
  type CatalogItem,
  type ComponentIndex,
  type Page,
  type Project,
  type SiteTheme,
} from "./model";
import { SectionView } from "./sections";

const STORAGE_KEY = "pleate-composer:v1";

function download(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function loadSaved(index: ComponentIndex): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeProject(JSON.parse(raw), index) : null;
  } catch {
    return null;
  }
}

const GROUPS = [...new Set(LIBRARY.map((l) => l.group))];

export function Composer({ catalog }: { catalog: CatalogItem[] }) {
  const bySlug = useMemo(() => new Map(catalog.map((c) => [c.slug, c])), [catalog]);
  const index = useMemo<ComponentIndex>(() => Object.fromEntries(catalog.map((c) => [c.slug, c.demos.map((d) => d.id)])), [catalog]);
  const codegen = useMemo<CodegenContext>(
    () => ({ backgrounds: Object.fromEntries(catalog.flatMap((c) => (c.background ? [[c.slug, c.background]] : []))) }),
    [catalog],
  );
  const [tab, setTab] = useState<"sections" | "components">("sections");
  const [history, dispatch] = useReducer(historyReducer<Project>, undefined, () => initHistory(defaultProject()));
  const project = history.present;
  const [ready, setReady] = useState(false);
  const [pageId, setPageId] = useState(project.pages[0].id);
  const [selected, setSelected] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [exportOpen, setExportOpen] = useState(false);
  const wide = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    const saved = loadSaved(index);
    if (saved) {
      dispatch({ type: "reset", value: saved });
      setPageId(saved.pages[0].id);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      } catch {
        // storage full or blocked: the project still lives in memory and can be exported
      }
    }, 300);
    return () => clearTimeout(t);
  }, [project, ready]);

  const page = project.pages.find((p) => p.id === pageId) ?? project.pages[0];
  const block = page.blocks.find((b) => b.id === selected) ?? null;

  const commit = (next: Project, merge?: string) => dispatch({ type: "set", value: next, merge });
  const setBlocks = (fn: (blocks: Block[]) => Block[], merge?: string) =>
    commit({ ...project, pages: project.pages.map((p) => (p.id === page.id ? { ...p, blocks: fn(p.blocks) } : p)) }, merge);
  const setTheme = (patch: Partial<SiteTheme>, merge?: string) => commit({ ...project, theme: { ...project.theme, ...patch } }, merge);

  const insert = (b: Block, index: number) => {
    setBlocks((bs) => [...bs.slice(0, index), b, ...bs.slice(index)]);
    setSelected(b.id);
  };
  const addFromLibrary = (itemId: string, index?: number) => {
    const item = LIBRARY.find((l) => l.id === itemId);
    if (!item) return;
    const at = index ?? (block ? page.blocks.indexOf(block) + 1 : page.blocks.length);
    insert(createBlock(item), at);
  };
  const addComponent = (slug: string, demo: string, background: boolean, index?: number) => {
    if (!bySlug.has(slug)) return;
    insert(componentBlock(slug, demo, background && canBackground(slug)), index ?? (block ? page.blocks.indexOf(block) + 1 : page.blocks.length));
  };
  const nameOf = (b: Block) => (b.type === "component" ? (bySlug.get(b.props.slug)?.name ?? "Component") : SECTIONS[b.type].name);
  const onDrop = (payload: DragPayload, index: number) => {
    if (payload.kind === "new") return addFromLibrary(payload.item, index);
    if (payload.kind === "component") return addComponent(payload.slug, payload.demo, payload.background, index);
    const from = page.blocks.findIndex((b) => b.id === payload.id);
    if (from === -1) return;
    setBlocks((bs) => move(bs, from, from < index ? index - 1 : index));
    setSelected(payload.id);
  };
  const moveBlock = (id: string, by: -1 | 1) => {
    const i = page.blocks.findIndex((b) => b.id === id);
    setBlocks((bs) => move(bs, i, i + by));
  };
  const duplicate = (id: string) => {
    const i = page.blocks.findIndex((b) => b.id === id);
    insert({ ...structuredClone(page.blocks[i]), id: uid() }, i + 1);
  };
  const remove = (id: string) => {
    setBlocks((bs) => bs.filter((b) => b.id !== id));
    if (selected === id) setSelected(null);
  };

  const addPage = () => {
    const p: Page = { id: uid(), name: `Page ${project.pages.length + 1}`, blocks: [] };
    commit({ ...project, pages: [...project.pages, p] });
    setPageId(p.id);
    setSelected(null);
  };
  const renamePage = (name: string) => commit({ ...project, pages: project.pages.map((p) => (p.id === page.id ? { ...p, name } : p)) }, `rename:${page.id}`);
  const deletePage = () => {
    if (project.pages.length < 2) return;
    const rest = project.pages.filter((p) => p.id !== page.id);
    commit({ ...project, pages: rest });
    setPageId(rest[0].id);
    setSelected(null);
  };

  // Undo / redo from anywhere in the editor; text fields included, since typing is merged into steps.
  const undoRedo = useRef({ canUndo: false, canRedo: false });
  undoRedo.current = { canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
  useEffect(() => {
    if (!wide) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "z" || k === "y") {
        e.preventDefault();
        dispatch({ type: k === "y" || e.shiftKey ? "redo" : "undo" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wide]);

  // Undo can remove the selected section or page: fall back gracefully.
  useEffect(() => {
    if (!project.pages.some((p) => p.id === pageId)) setPageId(project.pages[0].id);
  }, [project, pageId]);

  const fileInput = useRef<HTMLInputElement>(null);
  const importFile = async (file: File) => {
    try {
      const next = sanitizeProject(JSON.parse(await file.text()), index);
      if (!next) throw new Error("not a project");
      commit(next);
      setPageId(next.pages[0].id);
      setSelected(null);
      toast("Project imported", { tone: "success" });
    } catch {
      toast("That file is not a composer project", { tone: "error" });
    }
  };

  if (!ready) return <div className="min-h-[60dvh]" />;
  if (!wide) return <PhonePreview project={project} page={page} onPage={setPageId} />;

  return (
    <div className="fixed inset-0 z-(--pl-z-sticky) flex flex-col bg-bg text-fg">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-separator px-3">
        <Button asChild size="sm" variant="plain" tone="neutral" startIcon={<ArrowLeft />}>
          <Link href="/">Docs</Link>
        </Button>
        <span className="font-brand text-headline font-bold tracking-[-0.04em]">
          Composer
        </span>
        <span className="truncate text-footnote text-fg-muted">{page.name}</span>
        <div className="mx-auto">
          <SegmentedControl<Device>
            aria-label="Preview width"
            size="sm"
            value={device}
            onValueChange={setDevice}
            options={[
              { value: "desktop", label: "Desktop", icon: <Monitor /> },
              { value: "tablet", label: "Tablet", icon: <Tablet /> },
              { value: "mobile", label: "Mobile", icon: <Smartphone /> },
            ]}
          />
        </div>
        <div className="flex items-center gap-1">
          <IconButton aria-label="Undo" title="Undo (Ctrl+Z)" size="sm" variant="plain" tone="neutral" icon={<Undo2 />} disabled={!undoRedo.current.canUndo} onClick={() => dispatch({ type: "undo" })} />
          <IconButton aria-label="Redo" title="Redo (Shift+Ctrl+Z)" size="sm" variant="plain" tone="neutral" icon={<Redo2 />} disabled={!undoRedo.current.canRedo} onClick={() => dispatch({ type: "redo" })} />
          <span aria-hidden className="mx-1 h-5 w-px bg-separator" />
          <IconButton aria-label="Import project JSON" title="Import JSON" size="sm" variant="plain" tone="neutral" icon={<Upload />} onClick={() => fileInput.current?.click()} />
          <IconButton
            aria-label="Export project JSON"
            title="Export JSON"
            size="sm"
            variant="plain"
            tone="neutral"
            icon={<Download />}
            onClick={() => download(`${slugify(project.name)}.composer.json`, JSON.stringify(project, null, 2), "application/json")}
          />
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importFile(f);
              e.target.value = "";
            }}
          />
          <Button size="sm" startIcon={<Code />} className="ms-2" onClick={() => setExportOpen(true)}>
            Export code
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside aria-label="Pages and sections" className="flex w-64 shrink-0 flex-col gap-3 overflow-y-auto border-e border-separator p-3">
          <SidebarGroup label="Pages" variant="card">
            {project.pages.map((p) => (
              <SidebarItem
                key={p.id}
                icon={<FileText />}
                active={p.id === page.id}
                onClick={() => {
                  setPageId(p.id);
                  setSelected(null);
                }}
              >
                <span className="min-w-0 flex-1 truncate">{p.name || "Untitled"}</span>
              </SidebarItem>
            ))}
            <SidebarItem icon={<Plus />} onClick={addPage} className="text-fg-muted">
              New page
            </SidebarItem>
          </SidebarGroup>
          <SegmentedControl<"sections" | "components">
            aria-label="Library"
            size="sm"
            fullWidth
            value={tab}
            onValueChange={setTab}
            options={[
              { value: "sections", label: "Sections" },
              { value: "components", label: "Components" },
            ]}
          />
          <p className="px-2.5 text-caption1 text-fg-subtle">Drag onto the canvas, or press to add after the selected section.</p>
          {tab === "components" && <ComponentLibrary catalog={catalog} onAdd={(c) => addComponent(c.slug, c.demos[0]?.id ?? "", Boolean(c.background))} />}
          {tab === "sections" && GROUPS.map((group) => (
            <SidebarGroup key={group} label={group}>
              {LIBRARY.filter((l) => l.group === group).map((item) => (
                <SidebarItem
                  key={item.id}
                  draggable
                  title={item.description}
                  aria-description={item.description}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ kind: "new", item: item.id } satisfies DragPayload));
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => addFromLibrary(item.id)}
                  className="cursor-grab active:cursor-grabbing"
                  badge={<Plus className="size-3.5 text-fg-subtle" />}
                >
                  {item.name}
                </SidebarItem>
              ))}
            </SidebarGroup>
          ))}
        </aside>

        <main className="min-w-0 flex-1 overflow-hidden bg-fill-3 p-6" aria-label="Canvas">
          <FrameHost
            width={DEVICE_WIDTH[device]}
            state={{ blocks: page.blocks, names: Object.fromEntries(page.blocks.map((b) => [b.id, nameOf(b)])), selected, theme: project.theme }}
            handlers={{
              onSelect: setSelected,
              onDrop,
              onMove: moveBlock,
              onDuplicate: duplicate,
              onDelete: remove,
              onUndo: () => dispatch({ type: "undo" }),
              onRedo: () => dispatch({ type: "redo" }),
            }}
          />
        </main>

        <aside aria-label="Properties" className="w-80 shrink-0 overflow-y-auto border-s border-separator">
          {block ? (
            <div className="grid gap-4 p-4">
              <div className="flex items-center gap-2">
                <h2 className="min-w-0 flex-1 truncate text-headline">{nameOf(block)}</h2>
                <Button size="sm" variant="plain" onClick={() => setSelected(null)}>
                  Done
                </Button>
              </div>
              <Inspector
                key={block.id}
                fields={block.type === "component" ? componentFields(block.props, canBackground(block.props.slug)) : SECTIONS[block.type].fields}
                demoOptions={bySlug.get(block.props.slug)?.demos.map((d) => ({ value: d.id, label: d.title }))}
                props={block.props}
                scope={block.id}
                onChange={(key, value, merge) => setBlocks((bs) => bs.map((b) => (b.id === block.id ? { ...b, props: { ...b.props, [key]: value } } : b)), merge)}
              />
            </div>
          ) : (
            <PageSettings
              page={page}
              theme={project.theme}
              canDelete={project.pages.length > 1}
              onRename={renamePage}
              onDelete={deletePage}
              onTheme={setTheme}
            />
          )}
        </aside>
      </div>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} project={project} pageId={page.id} ctx={codegen} />
    </div>
  );
}

function PageSettings({
  page,
  theme,
  canDelete,
  onRename,
  onDelete,
  onTheme,
}: {
  page: Page;
  theme: SiteTheme;
  canDelete: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
  onTheme: (patch: Partial<SiteTheme>, merge?: string) => void;
}) {
  return (
    <div className="grid gap-8 p-4">
      <section className="grid gap-3">
        <h2 className="text-headline">Page</h2>
        <div className="grid gap-1.5">
          <label htmlFor="composer-page-name" className="text-footnote font-medium text-fg-muted">
            Name
          </label>
          <Input id="composer-page-name" size="sm" value={page.name} maxLength={60} onChange={(e) => onRename(e.target.value)} />
        </div>
        <Button size="sm" variant="tinted" tone="danger" startIcon={<Trash2 />} disabled={!canDelete} onClick={onDelete} className="justify-self-start">
          Delete page
        </Button>
      </section>

      <section className="grid gap-4">
        <h2 className="text-headline">Site theme</h2>
        <div className="grid gap-2">
          <span id="composer-palette" className="text-footnote font-medium text-fg-muted">
            Palette
          </span>
          <div role="radiogroup" aria-labelledby="composer-palette" className="grid grid-cols-6 gap-2">
            {Object.entries(PALETTES).map(([name, { label, seed }]) => (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={theme.palette === name}
                aria-label={label}
                title={label}
                onClick={() => onTheme({ palette: name })}
                className="pl-focus-ring grid size-8 cursor-pointer place-items-center rounded-full"
                style={{ background: seed }}
              >
                {theme.palette === name && <Check className="size-4" strokeWidth={3} style={{ color: createPalette(seed).light.onAccent }} />}
              </button>
            ))}
            <label
              title="Custom color"
              className={cn("relative grid size-8 cursor-pointer place-items-center overflow-hidden rounded-full", theme.palette === "custom" && "ring-2 ring-ring ring-offset-2 ring-offset-bg")}
              style={{ background: theme.custom }}
            >
              <input
                type="color"
                aria-label="Custom color"
                value={theme.custom}
                onChange={(e) => onTheme({ palette: "custom", custom: e.target.value }, "custom-color")}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>
        <div className="grid gap-2">
          <span className="text-footnote font-medium text-fg-muted">Appearance</span>
          <SegmentedControl<"light" | "dark">
            aria-label="Appearance"
            size="sm"
            fullWidth
            value={theme.mode}
            onValueChange={(mode) => onTheme({ mode })}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </div>
        <div className="grid gap-2">
          <span id="composer-roundness" className="flex justify-between text-footnote font-medium text-fg-muted">
            Roundness <span className="pl-tabular text-fg-subtle">{theme.roundness.toFixed(2)}</span>
          </span>
          <Slider
            aria-labelledby="composer-roundness"
            thumbLabels={["Roundness"]}
            min={0}
            max={3}
            step={0.25}
            value={[theme.roundness]}
            onValueChange={([v]) => onTheme({ roundness: v }, "roundness")}
          />
        </div>
      </section>
    </div>
  );
}

function ExportDialog({
  open,
  onOpenChange,
  project,
  pageId,
  ctx,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  project: Project;
  pageId: string;
  ctx: CodegenContext;
}) {
  const [sources, setSources] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState<string | null>(null);
  const needed = useMemo(() => (open ? demoKeysOf(project, ctx) : []), [open, project, ctx]);
  const missing = needed.filter((k) => !(k in sources));

  // Demo sources come from the docs on demand, only for the components used.
  useEffect(() => {
    if (!missing.length) return;
    let cancelled = false;
    Promise.all(
      missing.map((k) =>
        fetch(`/composer/source/${k}`)
          .then((r) => (r.ok ? r.text() : `// Could not load the source of ${k}.\n`))
          .catch(() => `// Could not load the source of ${k}.\n`)
          .then((code) => [k, code] as const),
      ),
    ).then((pairs) => !cancelled && setSources((s) => ({ ...s, ...Object.fromEntries(pairs) })));
    return () => {
      cancelled = true;
    };
  }, [missing.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const files = useMemo(() => (open ? generateProject(project, { ...ctx, sources }) : {}), [open, project, ctx, sources]);
  const paths = Object.keys(files);
  const pagePath = paths[Math.max(0, project.pages.findIndex((p) => p.id === pageId))];
  const path = current && current in files ? current : pagePath;
  const code = files[path] ?? "";
  return (
    <Modal open={open} onOpenChange={(o) => (onOpenChange(o), setCurrent(null))}>
      <ModalContent size="xl">
        <ModalHeader>
          <ModalTitle>Export code</ModalTitle>
          <ModalDescription>
            One Next.js page per composer page, and each component example as its own file under components/. Install pleate and lucide-react, then copy the files to the paths shown.
          </ModalDescription>
        </ModalHeader>
        {/* A list, not a Select: menus open under the modal overlay. */}
        <ModalBody className="grid grid-cols-[16rem_minmax(0,1fr)] gap-4">
          <ul aria-label="Files" className="grid content-start gap-0.5">
            {paths.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  aria-current={p === path || undefined}
                  onClick={() => setCurrent(p)}
                  className={cn(
                    "pl-focus-ring w-full truncate rounded-sm px-2.5 py-1.5 text-start font-mono text-caption1",
                    p === path ? "bg-accent-soft text-accent-ink" : "text-fg-muted hover:bg-fill-3",
                  )}
                  title={p}
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
          <Snippet code={missing.length ? "// Loading component sources" : code} language="tsx" maxHeight="55dvh" />
        </ModalBody>
        <ModalFooter>
          <Button variant="gray" startIcon={<Download />} disabled={!code} onClick={() => download(path.split("/").slice(-2).join("-"), code)}>
            Download this file
          </Button>
          <Button
            startIcon={<Download />}
            disabled={missing.length > 0}
            onClick={() => download(`${slugify(project.name)}-files.json`, JSON.stringify(files, null, 2), "application/json")}
          >
            Download all files
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/** Phones: the editor needs room, so show what was built, read only. */
function PhonePreview({ project, page, onPage }: { project: Project; page: Page; onPage: (id: string) => void }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-large-title">Composer</h1>
        <p className="text-callout text-fg-muted">The composer needs a wider screen. Open this page on a laptop or desktop to edit; here is a read-only preview of your site.</p>
      </div>
      {project.pages.length > 1 && (
        <SegmentedControl
          aria-label="Page"
          size="sm"
          value={page.id}
          onValueChange={onPage}
          options={project.pages.map((p) => ({ value: p.id, label: p.name || "Untitled" }))}
        />
      )}
      <div {...themeProps(project.theme)} className="overflow-hidden rounded-xl bg-bg text-fg shadow-[0_0_0_1px_var(--pl-separator)]" inert>
        {page.blocks.map((b) => (
          <SectionView key={b.id} block={b} />
        ))}
      </div>
    </div>
  );
}
