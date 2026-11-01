"use client";

import { AuthCard, AuthDivider } from "pleate/auth/auth-card";
import { OAuthButtons } from "pleate/auth/oauth-buttons";
import { Button } from "pleate/button";

export default function Demo() {
  return (
    <div className="grid w-full place-items-center rounded-xl sm:bg-bg sm:px-4 sm:py-10">
      <AuthCard
        logo={<span className="grid size-16 place-items-center rounded-[1.125rem] bg-accent font-brand text-title1 text-on-accent shadow-md">P</span>}
        title="Welcome to Plate"
        description="Plan the week's meals with your household and shop from one list."
        footer={
          <>
            Already have an account? <a href="#">Sign in</a>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <OAuthButtons providers={[{ id: "apple", name: "Apple" }, { id: "google", name: "Google" }]} />
          <AuthDivider />
          <Button size="lg" variant="gray" tone="neutral" fullWidth>Continue with email</Button>
          <p className="px-2 pt-1 text-center text-caption1 text-fg-muted">
            By continuing you agree to the <a href="#" className="text-accent-ink">Terms</a> and{" "}
            <a href="#" className="text-accent-ink">Privacy Policy</a>.
          </p>
        </div>
      </AuthCard>
    </div>
  );
}
