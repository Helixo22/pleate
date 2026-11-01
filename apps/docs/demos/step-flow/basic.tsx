import { StepFlow } from "pleate/effects/step-flow";
import { Input } from "pleate/input";

export default function Demo() {
  return (
    <StepFlow titles={["Welcome", "Name", "Plan"]} done={<p className="text-headline">You are all set.</p>}>
      <div>
        <p className="text-title3">Welcome</p>
        <p className="text-subhead text-fg-muted">Three quick steps to set up your workspace.</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-title3">Name your workspace</p>
        <Input aria-label="Workspace name" placeholder="Acme Studio" />
      </div>
      <div>
        <p className="text-title3">Pick a plan</p>
        <p className="text-subhead text-fg-muted">You can change it any time in settings.</p>
      </div>
    </StepFlow>
  );
}
