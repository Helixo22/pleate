// ApiKeyList: manage API keys. A table of keys (name, masked prefix like pl_abcd1234_••••, scope badges, created,
// last used, expiry) that turns into cards on phones; a Create dialog (name, scopes, expiry) that calls onCreate and
// then shows the full key once with a copy button; and Revoke behind a confirmation. Backend agnostic: you store
// keys, this renders them and reports intents.
"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { CheckIcon, CopyIcon, KeyIcon, PlusIcon } from "../../lib/icons.tsx";
import { formatShortDate, formatTimeAgo, toDate, type DateInput } from "../../lib/time.ts";
import { useCopy } from "../../lib/use-copy.ts";
import { Alert } from "../alert/alert.tsx";
import { AlertDialog } from "../alert-dialog/alert-dialog.tsx";
import { Badge } from "../badge/badge.tsx";
import { Button } from "../button/button.tsx";
import { Checkbox } from "../checkbox/checkbox.tsx";
import { EmptyState } from "../empty-state/empty-state.tsx";
import { Form, FormField, useForm } from "../form/form.tsx";
import { Input } from "../input/input.tsx";
import { Label } from "../label/label.tsx";
import { Modal, ModalBody, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "../modal/modal.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select/select.tsx";
import { Skeleton } from "../skeleton/skeleton.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table/table.tsx";

export type ApiKey = {
  id: string;
  name: string;
  /** Public part of the key, shown followed by "_••••" (e.g. "pl_abcd1234"). */
  prefix: string;
  scopes: string[];
  createdAt: DateInput;
  lastUsedAt?: DateInput | null;
  expiresAt?: DateInput | null;
};

export type ApiKeyScope = { value: string; label: string; description?: string };
export type ApiKeyExpiry = { value: string; label: string; /** null = never expires */ days: number | null };
export type ApiKeyCreateValues = { name: string; scopes: string[]; expiresInDays: number | null };

export type ApiKeyListLabels = {
  create?: string;
  name?: string;
  key?: string;
  scopes?: string;
  created?: string;
  lastUsed?: string;
  expires?: string;
  never?: string;
  neverUsed?: string;
  expired?: string;
  revoke?: string;
  revokeTitle?: (name: string) => string;
  revokeDescription?: string;
  cancel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  loading?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  namePlaceholder?: string;
  nameRequired?: string;
  scopesRequired?: string;
  expiry?: string;
  submit?: string;
  revealTitle?: string;
  revealDescription?: string;
  revealWarning?: string;
  copy?: string;
  copied?: string;
  done?: string;
  genericError?: string;
};

const L = {
  create: "Create key",
  name: "Name",
  key: "Key",
  scopes: "Scopes",
  created: "Created",
  lastUsed: "Last used",
  expires: "Expires",
  never: "Never",
  neverUsed: "Never used",
  expired: "Expired",
  revoke: "Revoke",
  revokeTitle: (name: string) => `Revoke "${name}"?`,
  revokeDescription: "Apps using this key will stop working right away. This can't be undone.",
  cancel: "Cancel",
  emptyTitle: "No API keys yet",
  emptyDescription: "Create a key to call the API from your scripts and servers.",
  loading: "Loading API keys",
  dialogTitle: "Create API key",
  dialogDescription: "Give it a name you'll recognize and only the access it needs.",
  namePlaceholder: "Production server",
  nameRequired: "Give the key a name.",
  scopesRequired: "Choose at least one scope.",
  expiry: "Expiration",
  submit: "Create key",
  revealTitle: "Your new API key",
  revealDescription: "Store it somewhere safe, like a secrets manager.",
  revealWarning: "Copy it now: for your security it won't be shown again.",
  copy: "Copy",
  copied: "Copied",
  done: "Done",
  genericError: "Something went wrong. Please try again.",
};

const EXPIRY: ApiKeyExpiry[] = [
  { value: "30", label: "30 days", days: 30 },
  { value: "90", label: "90 days", days: 90 },
  { value: "365", label: "1 year", days: 365 },
  { value: "never", label: "No expiration", days: null },
];

export type ApiKeyListProps = {
  keys: ApiKey[];
  /** Scopes offered in the create dialog. */
  scopes: ApiKeyScope[];
  defaultScopes?: string[];
  expiryOptions?: ApiKeyExpiry[];
  /** Value of the preselected expiry option. */
  defaultExpiry?: string;
  /** Create the key and resolve with its full secret, shown once. Throw to show an error in the dialog. */
  onCreate?: (values: ApiKeyCreateValues) => Promise<{ key: string }>;
  /** Revoke a key (after confirmation). Return a promise to show a spinner on its row. */
  onRevoke?: (id: string) => void | Promise<void>;
  loading?: boolean;
  /** Extra content in the header row, next to the Create button. */
  toolbar?: ReactNode;
  now?: Date;
  locale?: string;
  labels?: ApiKeyListLabels;
  className?: string;
};

function CreateSubmit({ label }: { label: string }) {
  const { submitting } = useForm();
  return (
    <Button type="submit" loading={submitting}>
      {label}
    </Button>
  );
}

function CopyField({ value, l }: { value: string; l: typeof L }) {
  const { copied, copy } = useCopy();
  return (
    <div className="flex items-center gap-2 rounded-xl bg-fill-2 p-1.5 ps-3.5">
      <code className="min-w-0 flex-1 font-mono text-subhead break-all text-fg select-all">{value}</code>
      <Button variant={copied ? "tinted" : "filled"} tone={copied ? "success" : "accent"} size="sm" onClick={() => copy(value)} startIcon={copied ? <CheckIcon /> : <CopyIcon />}>
        <span aria-live="polite">{copied ? l.copied : l.copy}</span>
      </Button>
    </div>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  scopes,
  defaultScopes,
  expiryOptions,
  defaultExpiry,
  onCreate,
  l,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scopes: ApiKeyScope[];
  defaultScopes: string[];
  expiryOptions: ApiKeyExpiry[];
  defaultExpiry: string;
  onCreate: NonNullable<ApiKeyListProps["onCreate"]>;
  l: typeof L;
}) {
  const [chosen, setChosen] = useState<string[]>(defaultScopes);
  const [expiry, setExpiry] = useState(defaultExpiry);
  const [scopeError, setScopeError] = useState<string>();
  const [error, setError] = useState<string>();
  const [secret, setSecret] = useState<string>();
  const id = useId();

  const reset = () => {
    setChosen(defaultScopes);
    setExpiry(defaultExpiry);
    setScopeError(undefined);
    setError(undefined);
    setSecret(undefined);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <ModalContent size="sm">
        {secret ? (
          <>
            <ModalHeader>
              <ModalTitle>{l.revealTitle}</ModalTitle>
              <ModalDescription>{l.revealDescription}</ModalDescription>
            </ModalHeader>
            <ModalBody className="flex flex-col gap-3">
              <Alert tone="warning" className="py-3">
                {l.revealWarning}
              </Alert>
              <CopyField value={secret} l={l} />
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => onOpenChange(false)}>{l.done}</Button>
            </ModalFooter>
          </>
        ) : (
          <Form
            className="flex min-h-0 flex-1 flex-col gap-0"
            onSubmit={async (values) => {
              setError(undefined);
              if (scopes.length > 0 && chosen.length === 0) {
                setScopeError(l.scopesRequired);
                return;
              }
              try {
                const option = expiryOptions.find((o) => o.value === expiry);
                const result = await onCreate({
                  name: String(values.name ?? "").trim(),
                  scopes: chosen,
                  expiresInDays: option ? option.days : null,
                });
                setSecret(result.key);
              } catch (e) {
                setError(e instanceof Error && e.message ? e.message : l.genericError);
              }
            }}
          >
            <ModalHeader>
              <ModalTitle>{l.dialogTitle}</ModalTitle>
              <ModalDescription>{l.dialogDescription}</ModalDescription>
            </ModalHeader>
            <ModalBody className="flex flex-col gap-5">
              {error && (
                <Alert tone="danger" className="py-3">
                  {error}
                </Alert>
              )}
              <FormField name="name" label={l.name} required={{ value: true, message: l.nameRequired }} maxLength={64}>
                <Input placeholder={l.namePlaceholder} autoComplete="off" autoFocus />
              </FormField>
              {scopes.length > 0 && (
                <fieldset className="flex flex-col gap-2" aria-describedby={scopeError ? `${id}-scopes-error` : undefined}>
                  <legend className="mb-2 text-subhead font-medium text-fg">{l.scopes}</legend>
                  <div className="flex flex-col gap-3 rounded-xl bg-fill-3 p-3.5">
                    {scopes.map((scope) => (
                      <Checkbox
                        key={scope.value}
                        shape="square"
                        size="sm"
                        label={<span className="font-mono text-subhead">{scope.label}</span>}
                        description={scope.description}
                        checked={chosen.includes(scope.value)}
                        invalid={Boolean(scopeError)}
                        onCheckedChange={(on) => {
                          setScopeError(undefined);
                          setChosen((list) => (on ? [...list, scope.value] : list.filter((v) => v !== scope.value)));
                        }}
                      />
                    ))}
                  </div>
                  {scopeError && (
                    <p id={`${id}-scopes-error`} role="alert" className="text-footnote font-medium text-danger-ink">
                      {scopeError}
                    </p>
                  )}
                </fieldset>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-expiry`}>{l.expiry}</Label>
                <Select value={expiry} onValueChange={setExpiry}>
                  <SelectTrigger id={`${id}-expiry`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expiryOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="gray" onClick={() => onOpenChange(false)}>
                {l.cancel}
              </Button>
              <CreateSubmit label={l.submit} />
            </ModalFooter>
          </Form>
        )}
      </ModalContent>
    </Modal>
  );
}

export function ApiKeyList({
  keys,
  scopes,
  defaultScopes = [],
  expiryOptions = EXPIRY,
  defaultExpiry,
  onCreate,
  onRevoke,
  loading,
  toolbar,
  now,
  locale,
  labels,
  className,
}: ApiKeyListProps) {
  const l = { ...L, ...labels };
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState<ApiKey | null>(null);
  const [pending, setPending] = useState<string[]>([]);
  const scopeLabel = (value: string) => scopes.find((s) => s.value === value)?.label ?? value;
  const reference = now ?? new Date();

  const revoke = async (id: string) => {
    if (!onRevoke) return;
    setPending((p) => [...p, id]);
    try {
      await onRevoke(id);
    } finally {
      setPending((p) => p.filter((x) => x !== id));
    }
  };

  const createButton = onCreate && (
    <Button size="sm" startIcon={<PlusIcon strokeWidth={2.5} />} onClick={() => setCreating(true)}>
      {l.create}
    </Button>
  );

  let content: ReactNode;
  if (loading && keys.length === 0) {
    content = (
      <div aria-busy="true" className="flex flex-col gap-4 rounded-2xl bg-surface p-4 shadow-xs">
        <span className="sr-only">{l.loading}</span>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton shape="text" width="20%" className="text-subhead" />
            <Skeleton shape="text" width="25%" className="text-subhead" />
            <Skeleton shape="text" width="30%" className="text-subhead" />
          </div>
        ))}
      </div>
    );
  } else if (keys.length === 0) {
    content = (
      <EmptyState
        bordered
        size="sm"
        icon={<KeyIcon strokeWidth={2} />}
        title={l.emptyTitle}
        description={l.emptyDescription}
        actions={createButton}
      />
    );
  } else {
    content = (
      <Table stackOnMobile>
        <TableHeader>
          <TableRow>
            <TableHead>{l.name}</TableHead>
            <TableHead>{l.key}</TableHead>
            <TableHead>{l.scopes}</TableHead>
            <TableHead>{l.lastUsed}</TableHead>
            <TableHead>{l.expires}</TableHead>
            {onRevoke && (
              <TableHead align="end">
                <span className="sr-only">{l.revoke}</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((k) => {
            const expired = k.expiresAt ? toDate(k.expiresAt).getTime() < reference.getTime() : false;
            return (
              <TableRow key={k.id} className={cn(expired && "opacity-60")}>
                <TableCell label={l.name}>
                  <span className="flex flex-col">
                    <span className="font-semibold">{k.name}</span>
                    <span className="text-footnote whitespace-nowrap text-fg-muted" suppressHydrationWarning>
                      {l.created} {formatShortDate(k.createdAt, locale)}
                    </span>
                  </span>
                </TableCell>
                <TableCell label={l.key}>
                  <code className="rounded-md bg-fill-2 px-1.5 py-0.5 font-mono text-footnote whitespace-nowrap text-fg">
                    {k.prefix}_<span aria-hidden="true">••••</span>
                  </code>
                </TableCell>
                <TableCell label={l.scopes}>
                  <span className="flex flex-wrap justify-end gap-1 md:justify-start">
                    {k.scopes.map((s) => (
                      <Badge key={s} tone="neutral" size="sm" className="font-mono">
                        {scopeLabel(s)}
                      </Badge>
                    ))}
                  </span>
                </TableCell>
                <TableCell label={l.lastUsed} className="whitespace-nowrap text-fg-muted" suppressHydrationWarning>
                  {k.lastUsedAt ? formatTimeAgo(k.lastUsedAt, { now, locale }) : l.neverUsed}
                </TableCell>
                <TableCell label={l.expires} className="whitespace-nowrap" suppressHydrationWarning>
                  {expired ? (
                    <Badge tone="danger" size="sm">
                      {l.expired}
                    </Badge>
                  ) : (
                    <span className="text-fg-muted">{k.expiresAt ? formatShortDate(k.expiresAt, locale) : l.never}</span>
                  )}
                </TableCell>
                {onRevoke && (
                  <TableCell align="end" className="max-md:justify-end">
                    <Button
                      variant="plain"
                      tone="danger"
                      size="sm"
                      loading={pending.includes(k.id)}
                      aria-label={`${l.revoke} ${k.name}`}
                      onClick={() => setConfirm(k)}
                    >
                      {l.revoke}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-3", className)}>
      {(createButton || toolbar) && keys.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {toolbar}
          {createButton}
        </div>
      )}
      {content}
      {onCreate && (
        <CreateDialog
          open={creating}
          onOpenChange={setCreating}
          scopes={scopes}
          defaultScopes={defaultScopes}
          expiryOptions={expiryOptions}
          defaultExpiry={defaultExpiry ?? expiryOptions[0]?.value ?? ""}
          onCreate={onCreate}
          l={l}
        />
      )}
      {onRevoke && (
        <AlertDialog
          open={confirm !== null}
          onOpenChange={(open) => !open && setConfirm(null)}
          title={confirm ? l.revokeTitle(confirm.name) : ""}
          description={l.revokeDescription}
          actions={[
            { label: l.cancel, role: "cancel" },
            { label: l.revoke, role: "destructive", onSelect: () => confirm && void revoke(confirm.id) },
          ]}
        />
      )}
    </div>
  );
}
