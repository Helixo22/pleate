"use client";

import { Mail } from "lucide-react";
import { Button } from "pleate/button";
import { Checkbox } from "pleate/checkbox";
import { DatePicker } from "pleate/date-picker";
import { FileUpload } from "pleate/file-upload";
import { Form, FormField, useForm } from "pleate/form";
import { Input } from "pleate/input";
import { Textarea } from "pleate/textarea";
import { toast } from "pleate/toast";

function Submit() {
  const { submitting } = useForm();
  return (
    <Button type="submit" size="lg" loading={submitting} className="self-start">
      Request booking
    </Button>
  );
}

export default function Demo() {
  const today = new Date();
  return (
    <Form
      className="w-full max-w-lg"
      onSubmit={async (values) => {
        await new Promise((r) => setTimeout(r, 1200));
        toast.success("Request sent", { description: `We'll reply to ${values.email} within a day.` });
      }}
      onInvalid={(errors) => toast.error(`Check ${Object.keys(errors).length} field(s)`)}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField name="name" label="Full name" required minLength={{ value: 2, message: "Enter your full name." }}>
          <Input autoComplete="name" placeholder="Jane Appleseed" />
        </FormField>
        <FormField name="email" label="Email" required type="email" description="Your confirmation goes here.">
          <Input type="email" autoComplete="email" placeholder="you@example.com" startAdornment={<Mail />} />
        </FormField>
      </div>
      <FormField
        name="dates"
        label="Dates"
        required={{ value: true, message: "Choose your check-in and check-out." }}
        validate={(v) => {
          if (typeof v !== "string" || !v) return;
          const [from, to] = v.split("/").map((s) => new Date(s));
          return (to.getTime() - from.getTime()) / 864e5 > 14 ? "Stays are limited to 14 nights." : undefined;
        }}
      >
        <DatePicker mode="range" min={today} placeholder="Check-in – check-out" />
      </FormField>
      <FormField name="guests" label="Guests" required min={{ value: 1, message: "At least one guest." }} max={8} hint="1–8">
        <Input type="number" inputMode="numeric" defaultValue={2} className="max-w-32" />
      </FormField>
      <FormField name="notes" label="Notes" hint="Optional" maxLength={200}>
        <Textarea placeholder="Late arrival, allergies, a cot…" minRows={2} maxLength={200} showCount />
      </FormField>
      <FormField name="documents" label="ID documents" description="Passport or ID card of the lead guest.">
        <FileUpload variant="button" accept="image/*,.pdf" maxSize={5 * 1024 * 1024} maxFiles={2} />
      </FormField>
      <FormField name="terms" required={{ value: true, message: "Please accept the terms to continue." }}>
        <Checkbox shape="square" label="I accept the booking terms" />
      </FormField>
      <Submit />
    </Form>
  );
}
