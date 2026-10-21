import { LogoMarquee } from "pleate/marketing/logo-marquee";

const NAMES = ["Alfama Stays", "Kyoto Rail", "NaplesEats", "Oaxaca Tours", "Fjord Air", "Atlas Hotels", "Medina Trails", "Porto Ferries"];

export default function Demo() {
  return (
    <div className="grid w-full gap-6">
      <LogoMarquee label="Partners">
        {NAMES.map((n) => (
          <span key={n} className="text-title3 font-bold whitespace-nowrap text-fg-subtle">{n}</span>
        ))}
      </LogoMarquee>
      <LogoMarquee reverse duration={40} gap="1rem">
        {NAMES.map((n) => (
          <span key={n} className="rounded-full bg-fill-2 px-4 py-2 text-subhead font-medium whitespace-nowrap">{n}</span>
        ))}
      </LogoMarquee>
    </div>
  );
}
