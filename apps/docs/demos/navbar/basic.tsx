import { Button } from "pleate/button";
import { Navbar, NavbarLink } from "pleate/navbar";

export default function Demo() {
  return (
    <div className="w-full overflow-hidden rounded-2xl shadow-[inset_0_0_0_1px_var(--pl-separator)]">
      <Navbar
        sticky={false}
        brand={<a href="#basic" className="text-headline font-bold">Plate</a>}
        actions={<Button size="sm">Sign in</Button>}
        panelFooter={<Button size="lg" fullWidth>Start planning</Button>}
      >
        <NavbarLink href="#basic" active>Explore</NavbarLink>
        <NavbarLink href="#basic">Planify</NavbarLink>
        <NavbarLink href="#basic">Stories</NavbarLink>
        <NavbarLink href="#basic">Support</NavbarLink>
      </Navbar>
      <div className="h-40 bg-bg" />
    </div>
  );
}
