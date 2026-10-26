// TwoFactorSetup: turn on an authenticator app in three steps. 1) Scan the QR code (an SVG string from your server,
// shown as an <img> data URL so no markup is injected) or copy the secret; 2) type the 6 digit code, checked by
// onVerify; 3) save the backup codes (copy or download as a text file) and finish.
"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Button } from "../../components/button/button.tsx";
import { OTPInput } from "../../components/otp-input/otp-input.tsx";
import { cn } from "../../lib/cn.ts";
import { CheckIcon, CopyIcon, DownloadIcon } from "../../lib/icons.tsx";
import { useCopy } from "../../lib/use-copy.ts";
import { FormError } from "../shared.tsx";

export type TwoFactorSetupStep = "scan" | "verify" | "backup";

export type TwoFactorSetupLabels = {
  step?: (index: number, total: number) => string;
  scanTitle?: string;
  scanDescription?: string;
  qrAlt?: string;
  secretLabel?: string;
  copy?: string;
  copied?: string;
  next?: string;
  back?: string;
  verifyTitle?: string;
  verifyDescription?: string;
  verify?: string;
  codeLabel?: string;
  invalidCode?: string;
  backupTitle?: string;
  backupDescription?: string;
  copyAll?: string;
  download?: string;
  done?: string;
};

const L = {
  step: (i: number, n: number) => `Step ${i} of ${n}`,
  scanTitle: "Scan the QR code",
  scanDescription: "Open your authenticator app (1Password, Google Authenticator, Authy…) and scan this code.",
  qrAlt: "QR code to add this account to an authenticator app",
  secretLabel: "Can't scan it? Enter this key instead",
  copy: "Copy",
  copied: "Copied",
  next: "Continue",
  back: "Back",
  verifyTitle: "Enter the code",
  verifyDescription: "Type the 6 digit code your app shows for this account.",
  verify: "Verify and turn on",
  codeLabel: "Code from your authenticator app",
  invalidCode: "That code didn't work. Check the time on your phone and try again.",
  backupTitle: "Save your backup codes",
  backupDescription: "Each code works once, if you lose your phone. Keep them somewhere safe, like a password manager.",
  copyAll: "Copy all",
  download: "Download",
  done: "Done",
};

export type TwoFactorSetupProps = {
  /** SVG markup of the QR code (rendered as an image, never injected). */
  qrSvg?: string;
  /** Or an image URL (PNG data URL, remote image). */
  qrSrc?: string;
  /** The base32 secret, for manual entry. */
  secret: string;
  /** Check the code; throw (or reject) when wrong. May return the backup codes. */
  onVerify: (code: string) => Promise<void | { backupCodes?: string[] }>;
  /** Backup codes, when you load them yourself after onVerify. */
  backupCodes?: string[];
  /** Called from the last step. */
  onDone?: () => void;
  step?: TwoFactorSetupStep;
  defaultStep?: TwoFactorSetupStep;
  onStepChange?: (step: TwoFactorSetupStep) => void;
  /** Controlled error for the verify step. */
  error?: string;
  /** File name of the downloaded backup codes. */
  downloadName?: string;
  /** Text at the top of the downloaded file (your app name, the account). */
  downloadHeader?: string;
  codeLength?: number;
  labels?: TwoFactorSetupLabels;
  className?: string;
};

const STEPS: TwoFactorSetupStep[] = ["scan", "verify", "backup"];

/** Encodes an SVG string as an image URL, so the markup can't run scripts or touch the page. */
export const svgToDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

function CopyButton({ value, label, copiedLabel, className }: { value: string; label: string; copiedLabel: string; className?: string }) {
  const { copied, copy } = useCopy();
  return (
    <Button variant="gray" size="sm" onClick={() => copy(value)} startIcon={copied ? <CheckIcon /> : <CopyIcon />} className={className}>
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </Button>
  );
}

function Header({ step, title, description, label }: { step: number; title: ReactNode; description: ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div aria-hidden="true" className="flex gap-1">
          {STEPS.map((_, i) => (
            <span key={i} className={cn("h-1.5 rounded-full transition-[width,background-color] duration-(--pl-duration-base)", i + 1 === step ? "w-5 bg-accent" : i + 1 < step ? "w-1.5 bg-accent" : "w-1.5 bg-fill")} />
          ))}
        </div>
        <span className="text-footnote font-medium text-fg-muted">{label}</span>
      </div>
      <h3 className="text-title3">{title}</h3>
      <p className="text-subhead text-pretty text-fg-muted">{description}</p>
    </div>
  );
}

export function TwoFactorSetup({
  qrSvg,
  qrSrc,
  secret,
  onVerify,
  backupCodes: backupProp,
  onDone,
  step: stepProp,
  defaultStep = "scan",
  onStepChange,
  error,
  downloadName = "backup-codes.txt",
  downloadHeader,
  codeLength = 6,
  labels,
  className,
}: TwoFactorSetupProps) {
  const l = { ...L, ...labels };
  const [stepState, setStepState] = useState(defaultStep);
  const step = stepProp ?? stepState;
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [failed, setFailed] = useState<string>();
  const [returned, setReturned] = useState<string[]>();
  const codes = backupProp ?? returned ?? [];
  const src = useMemo(() => qrSrc ?? (qrSvg ? svgToDataUrl(qrSvg) : undefined), [qrSrc, qrSvg]);
  const index = STEPS.indexOf(step) + 1;
  const go = (next: TwoFactorSetupStep) => {
    setStepState(next);
    onStepChange?.(next);
  };
  const grouped = secret.replace(/\s+/g, "").replace(/(.{4})(?=.)/g, "$1 ");

  const verify = async (value = code) => {
    if (value.length < codeLength || verifying) return;
    setVerifying(true);
    setFailed(undefined);
    try {
      const result = await onVerify(value);
      if (result && result.backupCodes) setReturned(result.backupCodes);
      go("backup");
    } catch (e) {
      setFailed(e instanceof Error && e.message ? e.message : l.invalidCode);
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  const download = () => {
    const body = [downloadHeader, ...codes].filter(Boolean).join("\n") + "\n";
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className={cn("flex w-full flex-col gap-5", className)}>
      {step === "scan" && (
        <>
          <Header step={index} label={l.step(index, 3)} title={l.scanTitle} description={l.scanDescription} />
          {src && (
            <div className="mx-auto grid size-48 place-items-center rounded-2xl bg-white p-3 shadow-[inset_0_0_0_1px_var(--pl-separator)]">
              <img src={src} alt={l.qrAlt} width={168} height={168} className="size-full object-contain" />
            </div>
          )}
          <div className="flex flex-col gap-2 rounded-2xl bg-fill-3 p-3.5">
            <span className="text-footnote text-fg-muted">{l.secretLabel}</span>
            <div className="flex items-center gap-3">
              <code className="min-w-0 flex-1 font-mono text-subhead font-semibold tracking-wide break-all">{grouped}</code>
              <CopyButton value={secret.replace(/\s+/g, "")} label={l.copy} copiedLabel={l.copied} />
            </div>
          </div>
          <Button size="lg" fullWidth onClick={() => go("verify")}>
            {l.next}
          </Button>
        </>
      )}

      {step === "verify" && (
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void verify();
          }}
        >
          <Header step={index} label={l.step(index, 3)} title={l.verifyTitle} description={l.verifyDescription} />
          <FormError error={error ?? failed} />
          <div className="flex justify-center">
            <OTPInput
              length={codeLength}
              value={code}
              onValueChange={setCode}
              onComplete={(value) => void verify(value)}
              invalid={Boolean(error ?? failed)}
              autoFocus
              labels={{ group: l.codeLabel }}
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="gray" size="lg" onClick={() => go("scan")} className="sm:flex-1">
              {l.back}
            </Button>
            <Button type="submit" size="lg" loading={verifying} disabled={code.length < codeLength} className="sm:flex-[2]">
              {l.verify}
            </Button>
          </div>
        </form>
      )}

      {step === "backup" && (
        <>
          <Header step={index} label={l.step(index, 3)} title={l.backupTitle} description={l.backupDescription} />
          <ul aria-label={l.backupTitle} className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl bg-fill-3 p-4 font-mono text-subhead font-semibold tracking-wide pl-tabular">
            {codes.map((c) => (
              <li key={c} className="text-center">
                {c}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <CopyButton value={codes.join("\n")} label={l.copyAll} copiedLabel={l.copied} className="flex-1" />
            <Button variant="gray" size="sm" startIcon={<DownloadIcon />} onClick={download} className="flex-1">
              {l.download}
            </Button>
          </div>
          <Button size="lg" fullWidth onClick={onDone}>
            {l.done}
          </Button>
        </>
      )}
    </div>
  );
}
