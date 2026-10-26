"use client";

import { AuthCard, AuthDivider } from "pleate/auth/auth-card";
import { Button } from "pleate/button";

export default function Demo() {
  return (
    <div className="grid w-full place-items-center rounded-3xl sm:bg-bg sm:px-4 sm:py-10">
      <AuthCard
        logo={<span className="grid size-12 place-items-center rounded-2xl bg-accent text-title3 font-bold text-on-accent">P</span>}
        title="Welcome to Plate"
        description="Plan meals with your household and never ask what's for dinner again."
        footer={
          <>
            Already have an account? <a href="#">Sign in</a>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Button size="lg" fullWidth>Create an account</Button>
          <AuthDivider />
          <Button size="lg" variant="gray" fullWidth>Continue as guest</Button>
        </div>
      </AuthCard>
    </div>
  );
}
