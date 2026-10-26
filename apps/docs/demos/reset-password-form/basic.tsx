"use client";

import { AuthCard } from "pleate/auth/auth-card";
import { ResetPasswordForm } from "pleate/auth/reset-password-form";
import { toast } from "pleate/toast";

export default function Demo() {
  return (
    <div className="grid w-full place-items-center rounded-3xl sm:bg-bg sm:px-4 sm:py-10">
      <AuthCard title="Choose a new password" description="Pick something you don't use anywhere else.">
        <ResetPasswordForm
          minStrength={2}
          onSubmit={async () => {
            await new Promise((r) => setTimeout(r, 1000)); // send it with the token from the link
            toast.success("Password updated", { description: "You can sign in with it now." });
          }}
        />
      </AuthCard>
    </div>
  );
}
