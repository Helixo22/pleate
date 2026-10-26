"use client";

import { AuthCard } from "pleate/auth/auth-card";
import { SignupForm } from "pleate/auth/signup-form";
import { Button } from "pleate/button";
import { useSignup } from "pleate-client/react";

export default function SignupDemo() {
  const signup = useSignup();
  const created = signup.signup.data;

  if (created) {
    return (
      <AuthCard
        title="Account created"
        description={
          created.verification_required
            ? `We sent a confirmation link to ${created.user.email}.`
            : `Signed in as ${created.user.email}. A confirmation link is on its way.`
        }
      >
        <Button variant="gray" className="w-full" onClick={() => signup.signup.reset()}>
          Start over
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your Plate account" description="Try an email that is already taken: ada@plate.dev.">
      <SignupForm {...signup.signupFormProps} terms={<>I agree to the Plate terms.</>} />
    </AuthCard>
  );
}
