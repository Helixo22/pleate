// Every docs page enters with pleate's own PageTransition (Next re-mounts this template on navigation).
import { PageTransition } from "pleate/effects/page-transition";

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition variant="fade-up">{children}</PageTransition>;
}
