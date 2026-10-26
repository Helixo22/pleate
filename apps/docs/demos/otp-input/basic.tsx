"use client";

import { Button } from "pleate/button";
import { OTPInput } from "pleate/otp-input";
import { useState } from "react";

export default function Demo() {
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "ok" | "wrong">("idle");
  const check = async (value: string) => {
    setState("checking");
    await new Promise((r) => setTimeout(r, 700));
    setState(value === "123456" ? "ok" : "wrong");
  };
  return (
    <div className="grid w-full justify-items-center gap-10">
      <div className="grid justify-items-center gap-3">
        <OTPInput
          value={code}
          onValueChange={(v) => {
            setCode(v);
            if (state !== "checking") setState("idle");
          }}
          onComplete={check}
          invalid={state === "wrong"}
          disabled={state === "checking"}
        />
        <p className="text-footnote text-fg-muted" aria-live="polite">
          {state === "checking" && "Checking…"}
          {state === "ok" && <span className="font-semibold text-success-ink">Verified.</span>}
          {state === "wrong" && <span className="font-semibold text-danger-ink">Wrong code. Try 123456.</span>}
          {state === "idle" && "Type or paste 123456."}
        </p>
        <Button variant="plain" size="sm" onClick={() => { setCode(""); setState("idle"); }}>
          Clear
        </Button>
      </div>
      <div className="grid justify-items-center gap-2">
        <OTPInput mode="alphanumeric" length={8} groupSize={4} size="sm" labels={{ group: "Recovery code" }} />
        <p className="text-footnote text-fg-muted">Alphanumeric, grouped by four</p>
      </div>
      <OTPInput length={4} size="lg" defaultValue="2048" disabled labels={{ group: "Disabled PIN" }} />
    </div>
  );
}
