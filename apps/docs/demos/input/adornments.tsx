import { Euro, Mail, Search } from "lucide-react";
import { Input } from "pleate/input";

export default function Demo() {
  return (
    <div className="mx-auto grid w-full max-w-md gap-3">
      <Input type="search" aria-label="Search" placeholder="Search destinations" startAdornment={<Search />} />
      <Input type="email" aria-label="Email" placeholder="you@example.com" startAdornment={<Mail />} />
      <Input inputMode="decimal" aria-label="Budget" placeholder="0.00" startAdornment={<Euro />} endAdornment={<span className="text-subhead">per night</span>} />
    </div>
  );
}
