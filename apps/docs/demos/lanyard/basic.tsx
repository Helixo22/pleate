import { Lanyard } from "pleate/effects/lanyard";

export default function Demo() {
  return (
    <Lanyard label="Conference badge" className="max-w-md">
      <div className="flex h-full flex-col items-center p-5 text-center">
        <p className="text-caption1 font-semibold text-accent-ink">DEVDAYS 2026</p>
        <img src="https://picsum.photos/seed/pl-lanyard/200/200" alt="Profile photo of Mia Torres" className="mt-6 size-24 rounded-full object-cover" />
        <p className="mt-4 text-title3">Mia Torres</p>
        <p className="text-subhead text-fg-muted">Speaker</p>
        <p className="mt-auto rounded-full bg-accent px-3 py-1 text-caption1 font-semibold text-on-accent">All access</p>
      </div>
    </Lanyard>
  );
}
