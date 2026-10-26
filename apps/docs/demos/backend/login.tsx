"use client";

import { AuthCard } from "pleate/auth/auth-card";
import { LoginForm } from "pleate/auth/login-form";
import { TwoFactorForm } from "pleate/auth/two-factor-form";
import { Avatar } from "pleate/avatar";
import { Button } from "pleate/button";
import { type Me } from "pleate-client";
import { useLogin } from "pleate-client/react";
import { useState } from "react";

export default function LoginDemo() {
  const [user, setUser] = useState<Me | null>(null);
  // POST /api/auth/login, then POST /api/auth/mfa/verify when the account has 2FA.
  const login = useLogin({ onSuccess: setUser });

  if (user) {
    return (
      <AuthCard title={`Welcome, ${user.display_name}`} description={user.email}>
        <div className="flex flex-col items-center gap-4">
          <Avatar name={user.display_name} size="lg" />
          <p className="text-center text-subhead text-fg-muted">
            {user.extra.mfa_enabled ? "Signed in with a password and a code." : "Signed in with a password."}
          </p>
          <Button
            variant="gray"
            onClick={() => {
              setUser(null);
              login.reset();
            }}
          >
            Try another account
          </Button>
        </div>
      </AuthCard>
    );
  }

  return login.mfaRequired ? (
    <AuthCard title="Two step verification" description="Enter the 6 digit code from your authenticator app.">
      <TwoFactorForm
        {...login.twoFactorFormProps}
        footer={
          <button className="cursor-pointer font-semibold text-accent-ink" onClick={login.reset}>
            Use another account
          </button>
        }
      />
    </AuthCard>
  ) : (
    <AuthCard title="Sign in to Plate" description="Your recipes, orders and stock in one place.">
      <LoginForm {...login.loginFormProps} defaultEmail="ada@plate.dev" forgotPasswordHref="#forgot-password" />
    </AuthCard>
  );
}
