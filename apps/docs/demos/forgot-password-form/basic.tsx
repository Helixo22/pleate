"use client";

import { AuthCard } from "pleate/auth/auth-card";
import { ForgotPasswordForm } from "pleate/auth/forgot-password-form";

export default function Demo() {
  return (
    <div className="grid w-full place-items-center rounded-3xl sm:bg-bg sm:px-4 sm:py-10">
      <AuthCard title="Reset your password" description="Enter the email you use for Plate and we'll send you a link.">
        <ForgotPasswordForm
          onSubmit={() => new Promise((r) => setTimeout(r, 1000))}
          footer={<a href="#signin">Back to sign in</a>}
        />
      </AuthCard>
    </div>
  );
}
