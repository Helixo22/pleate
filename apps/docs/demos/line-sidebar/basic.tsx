import { LineSidebar } from "pleate/effects/line-sidebar";

const items = ["Overview", "Installation", "Theming", "Typography", "Colors", "Motion", "Accessibility", "Changelog"].map((label) => ({ label }));

export default function Demo() {
  return <LineSidebar items={items} defaultValue={2} aria-label="Docs sections" className="w-56" />;
}
