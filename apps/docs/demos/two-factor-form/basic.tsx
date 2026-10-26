"use client";

import { AuthCard } from "pleate/auth/auth-card";
import { TwoFactorForm, type TwoFactorValues } from "pleate/auth/two-factor-form";
import { toast } from "pleate/toast";

export default function Demo() {
  const verify = async ({ code, method }: TwoFactorValues) => {
    await new Promise((r) => setTimeout(r, 900)); // your API call
    const ok = method === "otp" ? code === "123456" : code.toLowerCase() === "plate-2026";
    if (!ok) throw new Error(method === "otp" ? "That code is wrong or expired. Try 123456." : "That backup code isn't valid. Try plate-2026.");
    toast.success("Signed in");
  };
  return (
    <div className="grid w-full place-items-center rounded-3xl sm:bg-bg sm:px-4 sm:py-10">
      <AuthCard title="Two-step verification" description="Enter the code from your authenticator app.">
        <TwoFactorForm
          onSubmit={verify}
          onResend={() => new Promise((r) => setTimeout(r, 600))}
          resendCooldown={20}
          footer={<a href="#signin">Sign in with another account</a>}
        />
      </AuthCard>
    </div>
  );
}
