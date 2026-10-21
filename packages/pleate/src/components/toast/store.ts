// Toast store: a tiny module-level queue so toast() works from anywhere (event handlers, async code, outside
// React). <Toaster /> subscribes and renders it.

import type { ReactNode } from "react";

export type ToastTone = "default" | "success" | "error" | "warning" | "info" | "loading";

export type ToastOptions = {
  id?: string;
  description?: ReactNode;
  tone?: ToastTone;
  icon?: ReactNode;
  action?: { label: ReactNode; onClick: () => void };
  /** Milliseconds before it hides; Infinity keeps it until dismissed. Loading toasts never time out. */
  duration?: number;
  dismissible?: boolean;
  onDismiss?: () => void;
};

export type ToastData = Omit<ToastOptions, "id"> & { id: string; title: ReactNode; createdAt: number };

type Listener = () => void;
let toasts: ToastData[] = [];
const listeners = new Set<Listener>();
let counter = 0;

const emit = () => listeners.forEach((l) => l());
const EMPTY: ToastData[] = [];

export const toastStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => toasts,
  getServerSnapshot: () => EMPTY,
};

function upsert(title: ReactNode, options: ToastOptions = {}) {
  const id = options.id ?? `pl-toast-${++counter}`;
  const existing = toasts.find((t) => t.id === id);
  const next: ToastData = { ...existing, ...options, id, title, createdAt: existing?.createdAt ?? Date.now() };
  toasts = existing ? toasts.map((t) => (t.id === id ? next : t)) : [next, ...toasts];
  emit();
  return id;
}

function dismiss(id?: string) {
  const gone = id ? toasts.filter((t) => t.id === id) : toasts;
  gone.forEach((t) => t.onDismiss?.());
  toasts = id ? toasts.filter((t) => t.id !== id) : [];
  emit();
}

type Message<T> = ReactNode | ((value: T) => ReactNode);

export const toast = Object.assign((title: ReactNode, options?: ToastOptions) => upsert(title, options), {
  success: (title: ReactNode, options?: ToastOptions) => upsert(title, { ...options, tone: "success" }),
  error: (title: ReactNode, options?: ToastOptions) => upsert(title, { ...options, tone: "error" }),
  warning: (title: ReactNode, options?: ToastOptions) => upsert(title, { ...options, tone: "warning" }),
  info: (title: ReactNode, options?: ToastOptions) => upsert(title, { ...options, tone: "info" }),
  loading: (title: ReactNode, options?: ToastOptions) => upsert(title, { ...options, tone: "loading" }),
  update: (id: string, title: ReactNode, options?: ToastOptions) => upsert(title, { ...options, id }),
  dismiss,
  /** Shows a loading toast that turns into success or error when the promise settles. Returns the promise. */
  promise<T>(promise: Promise<T>, messages: { loading: ReactNode; success: Message<T>; error: Message<unknown> }, options?: ToastOptions) {
    const id = upsert(messages.loading, { ...options, tone: "loading" });
    const resolve = <V,>(m: Message<V>, v: V) => (typeof m === "function" ? (m as (value: V) => ReactNode)(v) : m);
    promise.then(
      (value) => upsert(resolve(messages.success, value), { ...options, id, tone: "success" }),
      (error) => upsert(resolve(messages.error, error), { ...options, id, tone: "error" }),
    );
    return promise;
  },
});
