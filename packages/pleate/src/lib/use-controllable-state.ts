// State that can be controlled (value + onChange from the parent) or uncontrolled (defaultValue), like native inputs.
"use client";

import { useCallback, useRef, useState } from "react";

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? (value as T) : internal;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(current) : next;
      if (!controlled) setInternal(resolved);
      if (!Object.is(resolved, current)) onChangeRef.current?.(resolved);
    },
    [controlled, current],
  );

  return [current, setValue] as const;
}
