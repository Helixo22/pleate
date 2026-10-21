// Field rules and the function that checks a value against them. Messages default to short English sentences; pass
// { value, message } to any rule for your own wording (or translation).

export type Rule<T> = T | { value: T; message: string };
export type FieldValue = FormDataEntryValue | FormDataEntryValue[] | null | undefined;

export type FieldRules = {
  required?: Rule<boolean>;
  minLength?: Rule<number>;
  maxLength?: Rule<number>;
  min?: Rule<number>;
  max?: Rule<number>;
  pattern?: Rule<RegExp>;
  /** "email" and "url" use built-in patterns. */
  type?: Rule<"email" | "url">;
  /** Any check: return an error message, or nothing when valid. May be async. */
  validate?: (value: FieldValue, values: Record<string, FieldValue>) => string | undefined | null | Promise<string | undefined | null>;
};

const unwrap = <T,>(rule: Rule<T>, fallback: (v: T) => string): [T, string] =>
  typeof rule === "object" && rule !== null && "value" in (rule as object) && "message" in (rule as object)
    ? [(rule as { value: T }).value, (rule as { message: string }).message]
    : [rule as T, fallback(rule as T)];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function checkField(value: FieldValue, rules: FieldRules, values: Record<string, FieldValue> = {}): Promise<string | undefined> {
  const text = Array.isArray(value) ? value.join(",") : typeof value === "string" ? value : value ? (value as File).name : "";
  const empty = Array.isArray(value) ? value.length === 0 : text.trim() === "" || (value instanceof File && value.size === 0);

  if (rules.required !== undefined) {
    const [on, message] = unwrap(rules.required, () => "This field is required.");
    if (on && empty) return message;
  }
  if (!empty) {
    if (rules.minLength !== undefined) {
      const [n, message] = unwrap(rules.minLength, (v) => `Use at least ${v} characters.`);
      if (text.length < n) return message;
    }
    if (rules.maxLength !== undefined) {
      const [n, message] = unwrap(rules.maxLength, (v) => `Use at most ${v} characters.`);
      if (text.length > n) return message;
    }
    if (rules.min !== undefined) {
      const [n, message] = unwrap(rules.min, (v) => `Enter ${v} or more.`);
      if (Number(text) < n) return message;
    }
    if (rules.max !== undefined) {
      const [n, message] = unwrap(rules.max, (v) => `Enter ${v} or less.`);
      if (Number(text) > n) return message;
    }
    if (rules.type !== undefined) {
      const [kind, message] = unwrap(rules.type, (v) => (v === "email" ? "Enter a valid email address." : "Enter a valid URL."));
      const ok = kind === "email" ? EMAIL.test(text) : URL.canParse?.(text) ?? /^https?:\/\/\S+$/.test(text);
      if (!ok) return message;
    }
    if (rules.pattern !== undefined) {
      const [re, message] = unwrap(rules.pattern, () => "Check the format.");
      if (!re.test(text)) return message;
    }
  }
  if (rules.validate) return (await rules.validate(value, values)) ?? undefined;
  return undefined;
}

export function readValues(form: HTMLFormElement): Record<string, FieldValue> {
  const data = new FormData(form);
  const values: Record<string, FieldValue> = {};
  for (const key of new Set(data.keys())) {
    const all = data.getAll(key);
    values[key] = all.length > 1 ? all : all[0];
  }
  return values;
}
