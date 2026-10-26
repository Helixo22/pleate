"use client";

import { AuthCard } from "pleate/auth/auth-card";
import { SignupForm, type SignupValues } from "pleate/auth/signup-form";
import { toast } from "pleate/toast";
import { useState } from "react";

export default function Demo() {
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});
  const signUp = async (values: SignupValues) => {
    setFieldErrors({});
    await new Promise((r) => setTimeout(r, 1200)); // your API call
    if (values.email.endsWith("@taken.com")) {
      setFieldErrors({ email: "An account with this email already exists." });
      return;
    }
    toast.success("Account created", { description: `Check ${values.email} to confirm it.` });
  };
  return (
    <div className="grid w-full place-items-center rounded-3xl sm:bg-bg sm:px-4 sm:py-10">
      <AuthCard
        title="Create your Plate account"
        description="Free for households up to six people."
        footer={
          <>
            Already have an account? <a href="#signin">Sign in</a>
          </>
        }
      >
        <SignupForm
          onSubmit={signUp}
          fieldErrors={fieldErrors}
          minStrength={2}
          terms={
            <>
              I agree to the <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>
            </>
          }
        />
      </AuthCard>
    </div>
  );
}
