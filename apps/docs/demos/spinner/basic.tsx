import { Spinner } from "pleate/spinner";

export default function Demo() {
  return (
    <>
      <Spinner size="xs" />
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" className="text-fg-muted" />
      <Spinner size="xl" className="text-accent-ink" />
    </>
  );
}
