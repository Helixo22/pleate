import { Strands } from "pleate/effects/strands";

export default function Demo() {
  return (
    <>
      <Strands className="w-64" />
      <Strands spectral={false} count={4} className="w-40" />
    </>
  );
}
