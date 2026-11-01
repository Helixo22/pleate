import { StarBorder } from "pleate/effects/star-border";

export default function Demo() {
  return (
    <>
      <StarBorder>Get started</StarBorder>
      <StarBorder as="a" href="#" color="var(--pl-fg)" speed={6}>
        Read the docs
      </StarBorder>
    </>
  );
}
