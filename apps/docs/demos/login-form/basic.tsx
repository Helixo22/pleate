"use client";

import { AuthCard } from "pleate/auth/auth-card";
import { LoginForm, type LoginValues } from "pleate/auth/login-form";
import { OAuthButtons } from "pleate/auth/oauth-buttons";
import { toast } from "pleate/toast";
import { useState } from "react";

export default function Demo() {
  const [error, setError] = useState<string>();
  const signIn = async ({ email, password }: LoginValues) => {
    setError(undefined);
    await new Promise((r) => setTimeout(r, 1000)); // your API call
    if (password !== "plate123") {
      setError("That email and password don't match. Try plate123.");
      return;
    }
    toast.success("Signed in", { description: `Welcome back, ${email}.` });
  };
  return (
    <div className="grid w-full place-items-center rounded-xl sm:bg-bg sm:px-4 sm:py-10">
      <AuthCard
        logo={<span className="grid size-16 place-items-center rounded-[1.125rem] bg-accent font-brand text-title1 text-on-accent shadow-md">P</span>}
        title="Sign in to Plate"
        description="Welcome back. Your recipes missed you."
      >
        <LoginForm
          onSubmit={signIn}
          error={error}
          forgotPasswordHref="#forgot"
          oauth={<OAuthButtons providers={[{ id: "apple", name: "Apple" }, { id: "google", name: "Google" }]} />}
          footer={
            <>
              New to Plate? <a href="#signup">Create an account</a>
            </>
          }
        />
      </AuthCard>
    </div>
  );
}
