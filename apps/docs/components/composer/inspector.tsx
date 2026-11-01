// Props editor: one control per schema field (text, long text, URL, select, switch, number, item lists).
"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button, IconButton, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Textarea } from "pleate";
import { useId } from "react";
import type { Field, Props } from "./model";

type Change = (key: string, value: unknown, merge?: string) => void;

export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function FieldRow({ label, hint, id, children }: { label: string; hint?: string; id: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-footnote font-medium text-fg-muted">
        {label}
      </label>
      {children}
      {hint && <p className="text-caption1 text-fg-subtle">{hint}</p>}
    </div>
  );
}

function Control({ field, value, onChange, scope }: { field: Field; value: unknown; onChange: Change; scope: string }) {
  const id = useId();
  const merge = `${scope}:${field.key}`;
  switch (field.kind) {
    case "switch":
      return <Switch size="sm" label={field.label} checked={Boolean(value)} onCheckedChange={(v) => onChange(field.key, v)} />;
    case "select":
      return (
        <FieldRow label={field.label} id={id}>
          <Select value={String(value)} onValueChange={(v) => onChange(field.key, v)}>
            <SelectTrigger id={id} size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
      );
    case "number":
      return (
        <FieldRow label={field.label} id={id}>
          <Input
            id={id}
            size="sm"
            type="number"
            inputMode="decimal"
            min={field.min}
            max={field.max}
            step={field.step}
            value={String(value ?? 0)}
            onChange={(e) => {
              const n = e.target.valueAsNumber;
              if (Number.isFinite(n)) onChange(field.key, field.max !== undefined ? Math.min(field.max, n) : n, merge);
            }}
          />
        </FieldRow>
      );
    case "textarea":
      return (
        <FieldRow label={field.label} hint={field.hint} id={id}>
          <Textarea id={id} size="sm" autoResize minRows={2} maxRows={8} value={String(value ?? "")} onChange={(e) => onChange(field.key, e.target.value, merge)} />
        </FieldRow>
      );
    case "items":
      return <ItemsControl field={field} value={(value as Props[]) ?? []} onChange={onChange} scope={scope} />;
    default:
      return (
        <FieldRow label={field.label} hint={field.hint} id={id}>
          <Input
            id={id}
            size="sm"
            type={field.kind === "url" ? "url" : "text"}
            placeholder={field.kind === "url" ? "https://" : undefined}
            value={String(value ?? "")}
            onChange={(e) => onChange(field.key, e.target.value, merge)}
          />
        </FieldRow>
      );
  }
}

function ItemsControl({ field, value, onChange, scope }: { field: Extract<Field, { kind: "items" }>; value: Props[]; onChange: Change; scope: string }) {
  const set = (next: Props[], merge?: string) => onChange(field.key, next, merge);
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1.5 text-footnote font-medium text-fg-muted">{field.label}</legend>
      {value.map((item, i) => (
        <details key={i} className="group rounded-md bg-fill-3 open:bg-surface-2 open:shadow-[inset_0_0_0_1px_var(--pl-separator)]">
          <summary className="pl-focus-ring flex cursor-pointer list-none items-center gap-1 rounded-md py-1.5 ps-3 pe-1.5 text-subhead [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 flex-1 truncate">{String(item[field.titleKey] || `${field.itemLabel} ${i + 1}`)}</span>
            <IconButton aria-label={`Move ${field.itemLabel.toLowerCase()} up`} size="xs" variant="plain" tone="neutral" icon={<ArrowUp />} disabled={i === 0} onClick={(e) => (e.preventDefault(), set(move(value, i, i - 1)))} />
            <IconButton aria-label={`Move ${field.itemLabel.toLowerCase()} down`} size="xs" variant="plain" tone="neutral" icon={<ArrowDown />} disabled={i === value.length - 1} onClick={(e) => (e.preventDefault(), set(move(value, i, i + 1)))} />
            <IconButton aria-label={`Remove ${field.itemLabel.toLowerCase()}`} size="xs" variant="plain" tone="danger" icon={<Trash2 />} onClick={(e) => (e.preventDefault(), set(value.filter((_, j) => j !== i)))} />
          </summary>
          <div className="grid gap-3 px-3 pt-1 pb-3">
            {field.fields.map((sub) => (
              <Control
                key={sub.key}
                field={sub}
                value={item[sub.key]}
                scope={`${scope}:${field.key}:${i}`}
                onChange={(key, v, merge) => set(value.map((it, j) => (j === i ? { ...it, [key]: v } : it)), merge)}
              />
            ))}
          </div>
        </details>
      ))}
      <Button size="sm" variant="plain" startIcon={<Plus />} className="justify-self-start" onClick={() => set([...value, { ...field.template }])}>
        Add {field.itemLabel.toLowerCase()}
      </Button>
    </fieldset>
  );
}

export function Inspector({ fields, props, scope, onChange }: { fields: Field[]; props: Props; scope: string; onChange: Change }) {
  return (
    <div className="grid gap-4">
      {fields.map((f) => (
        <Control key={f.key} field={f} value={props[f.key]} onChange={onChange} scope={scope} />
      ))}
    </div>
  );
}
