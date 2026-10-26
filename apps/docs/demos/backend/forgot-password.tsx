"use client";

import { AuthCard } from "pleate/auth/auth-card";
import { ForgotPasswordForm } from "pleate/auth/forgot-password-form";
import { useForgotPassword } from "pleate-client/react";

export default function ForgotPasswordDemo() {
  const forgot = useForgotPassword();
  return (
    <AuthCard title="Reset your password" description="We will email you a link to choose a new one.">
      <ForgotPasswordForm {...forgot.forgotPasswordFormProps} />
    </AuthCard>
  );
}
