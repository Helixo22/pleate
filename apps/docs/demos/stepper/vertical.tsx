import { Stepper } from "pleate/stepper";

const STEPS = [
  { id: "flight", label: "Flight booked", description: "TP 1351, Milan to Lisbon" },
  { id: "stay", label: "Stay confirmed", description: "Alfama flat, 4 nights" },
  { id: "checkin", label: "Online check-in", description: "Opens 36 hours before departure" },
  { id: "pass", label: "Boarding pass", description: "Sent to your email" },
];

export default function Demo() {
  return <Stepper aria-label="Trip checklist" orientation="vertical" steps={STEPS} current={2} className="w-full max-w-sm" />;
}
