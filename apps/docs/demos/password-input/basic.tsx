"use client";

import { Form, FormField } from "pleate/form";
import { PasswordInput, scorePassword } from "pleate/password-input";
import { useState } from "react";

export default function Demo() {
  const [value, setValue] = useState("");
  return (
    <div className="grid w-full max-w-sm gap-8">
      <FormField label="Password">
        <PasswordInput placeholder="Your password" />
      </FormField>
      <Form>
        <FormField name="password" label="New password" required minLength={{ value: 8, message: "Use at least 8 characters." }}>
          <PasswordInput autoComplete="new-password" showStrength value={value} onChange={(e) => setValue(e.target.value)} />
        </FormField>
      </Form>
      <p className="text-footnote text-fg-muted">
        scorePassword(&quot;{value || "…"}&quot;) = <span className="font-mono font-semibold text-fg">{scorePassword(value)}</span>
      </p>
    </div>
  );
}
