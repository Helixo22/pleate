"use client";

import { TwoFactorSetup } from "pleate/auth/two-factor-setup";
import { Button } from "pleate/button";
import { toast } from "pleate/toast";
import { useTwoFactorSetup } from "pleate-client/react";
import { useState } from "react";

export default function TwoFactorSetupDemo() {
  const [open, setOpen] = useState(false);
  const mfa = useTwoFactorSetup({
    onDone: () => {
      setOpen(false);
      toast.success("Two factor authentication is on");
    },
  });

  if (open && mfa.twoFactorSetupProps) {
    return (
      <div className="mx-auto w-full max-w-[26rem] rounded-3xl bg-surface p-6 shadow-md sm:p-8">
        <TwoFactorSetup {...mfa.twoFactorSetupProps} downloadName="plate-backup-codes.txt" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[26rem] flex-col items-start gap-3 rounded-3xl bg-surface p-6 shadow-md">
      <p className="text-headline">Two factor authentication</p>
      <p className="text-subhead text-fg-muted">
        {mfa.status.isPending
          ? "Checking…"
          : mfa.enabled
            ? `On. ${mfa.status.data?.backup_codes_remaining ?? 0} backup codes left.`
            : "Off. Add a code from an authenticator app to every sign in."}
      </p>
      {mfa.enabled ? (
        <Button
          variant="tinted"
          tone="danger"
          loading={mfa.disable.isPending}
          onClick={() => mfa.disable.mutate({ password: "plate-demo-2026", code: "123456" })}
        >
          Turn off
        </Button>
      ) : (
        <Button
          loading={mfa.starting}
          disabled={mfa.status.isPending}
          onClick={async () => {
            await mfa.start();
            setOpen(true);
          }}
        >
          Turn on
        </Button>
      )}
    </div>
  );
}
