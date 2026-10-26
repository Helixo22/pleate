import { ApiError } from "../errors.ts";

/** Props every pleate form takes from a failed request: `error` and `fieldErrors`. */
export function errorProps(error: unknown): { error?: string; fieldErrors?: Record<string, string> } {
  if (!error) return {};
  if (error instanceof ApiError) {
    const fieldErrors = error.fieldErrors();
    const hasFields = Object.keys(fieldErrors).length > 0;
    return { error: hasFields && error.code === "validation_error" ? undefined : error.message, fieldErrors };
  }
  return { error: error instanceof Error ? error.message : String(error) };
}

/** Renames backend field names to the names a pleate form uses. */
export function mapFields(
  props: { error?: string; fieldErrors?: Record<string, string> },
  map: Record<string, string>,
) {
  if (!props.fieldErrors) return props;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(props.fieldErrors)) out[map[key] ?? key] = value;
  return { ...props, fieldErrors: out };
}
