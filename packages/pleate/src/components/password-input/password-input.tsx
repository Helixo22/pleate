// PasswordInput: an Input with a show/hide toggle and an optional strength meter (four bars and a word) fed by a
// small built-in scorer, scorePassword(), or your own. Works inside FormField like Input: the id, name and aria props
// land on the <input>; the meter's text is added to its aria-describedby.
"use client";

import { useId, useState, type ChangeEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { EyeIcon, EyeOffIcon } from "../../lib/icons.tsx";
import { Input, type InputProps } from "../input/input.tsx";

export type PasswordScore = 0 | 1 | 2 | 3 | 4;

const COMMON = /^(password|passw0rd|qwerty|letmein|welcome|admin|iloveyou|monkey|dragon|abc123|111111|123123|12345678?9?0?)/i;

/**
 * A quick strength estimate from 0 (too weak) to 4 (strong): rewards length and mixing lowercase, uppercase, digits
 * and symbols; penalizes common passwords, repeated characters and simple sequences. A hint for people, not a
 * security check: keep validating on the server.
 */
export function scorePassword(password: string): PasswordScore {
  if (!password) return 0;
  const length = password.length;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  let points = 0;
  if (length >= 8) points++;
  if (length >= 12) points++;
  if (length >= 16) points++;
  points += Math.max(0, classes - 1);
  const unique = new Set(password).size;
  if (unique <= Math.max(2, length / 4)) points -= 2;
  if (/(.)\1\1/.test(password)) points--;
  if (/(?:abc|bcd|cde|def|123|234|345|456|567|678|789|890|qwe|wer|ert|asd|sdf|zxc)/i.test(password)) points--;
  if (COMMON.test(password)) points -= 3;
  if (length < 8) points = Math.min(points, 1);
  return Math.max(0, Math.min(4, points)) as PasswordScore;
}

export type PasswordInputLabels = {
  show?: string;
  hide?: string;
  /** Prefix of the meter text, "Strength". */
  strength?: string;
  /** Names for scores 0 to 4. */
  scores?: [string, string, string, string, string];
};

const L = {
  show: "Show password",
  hide: "Hide password",
  strength: "Strength",
  scores: ["Too weak", "Weak", "Fair", "Good", "Strong"] as [string, string, string, string, string],
};

const BAR_TONE = ["bg-danger", "bg-danger", "bg-warning", "bg-success-vivid", "bg-success-vivid"] as const;
const TEXT_TONE = ["text-fg-muted", "text-danger-ink", "text-warning-ink", "text-success-ink", "text-success-ink"] as const;

export type PasswordInputProps = Omit<InputProps, "type"> & {
  /** Show the strength meter under the field. */
  showStrength?: boolean;
  /** Your own scorer (e.g. zxcvbn); defaults to scorePassword. */
  scorer?: (password: string) => PasswordScore;
  /** Start with the password visible. */
  defaultVisible?: boolean;
  labels?: PasswordInputLabels;
  /** Classes for the outer wrapper (field + meter). */
  wrapperClassName?: string;
};

export function PasswordInput({
  showStrength = false,
  scorer = scorePassword,
  defaultVisible = false,
  labels,
  wrapperClassName,
  endAdornment,
  onChange,
  value,
  defaultValue,
  disabled,
  autoComplete = "current-password",
  size,
  ...props
}: PasswordInputProps) {
  const l = { ...L, ...labels };
  const [visible, setVisible] = useState(defaultVisible);
  const [typed, setTyped] = useState(String(defaultValue ?? ""));
  const text = value !== undefined ? String(value) : typed;
  const meterId = useId();
  const score = scorer(text);

  const toggle = (
    <button
      type="button"
      aria-label={visible ? l.hide : l.show}
      aria-pressed={visible}
      disabled={disabled}
      onClick={() => setVisible((v) => !v)}
      className={cn(
        "pl-focus-ring pl-touch -me-1.5 grid shrink-0 cursor-pointer place-items-center rounded-full text-fg-muted transition-colors hover:bg-fill-2 hover:text-fg disabled:cursor-not-allowed",
        size === "sm" ? "size-7" : "size-8",
      )}
    >
      {visible ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );

  const field = (
    <Input
      {...props}
      size={size}
      type={visible ? "text" : "password"}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      autoComplete={autoComplete}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      aria-describedby={[props["aria-describedby"], showStrength && text && meterId].filter(Boolean).join(" ") || undefined}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        setTyped(event.target.value);
        onChange?.(event);
      }}
      endAdornment={
        <span className="flex items-center gap-1.5">
          {endAdornment}
          {toggle}
        </span>
      }
    />
  );

  if (!showStrength) return field;
  return (
    <div className={cn("flex w-full flex-col gap-2", wrapperClassName)}>
      {field}
      <div className="flex items-center gap-3" data-score={text ? score : undefined}>
        <div aria-hidden="true" className="grid flex-1 grid-cols-4 gap-1">
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={cn(
                "h-1 rounded-full transition-colors duration-(--pl-duration-base)",
                text && score >= step ? BAR_TONE[score] : text && step === 1 ? BAR_TONE[0] : "bg-fill",
              )}
            />
          ))}
        </div>
        <span id={meterId} aria-live="polite" className={cn("min-w-[4.5rem] text-end text-footnote font-medium", text ? TEXT_TONE[score] : "text-fg-subtle")}>
          {text ? (
            <>
              <span className="sr-only">{l.strength}: </span>
              {l.scores[score]}
            </>
          ) : (
            <span aria-hidden="true">{l.strength}</span>
          )}
        </span>
      </div>
    </div>
  );
}
