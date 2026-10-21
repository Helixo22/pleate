import { Footer, FooterBottom, FooterColumn, FooterColumns, FooterLink } from "pleate/footer";

const COLUMNS = {
  Explore: ["Destinations", "Experiences", "Travel guides", "Deals"],
  Planify: ["How it works", "Itineraries", "Budgets", "Group trips"],
  Company: ["About", "Careers", "Press", "Contact"],
  Support: ["Help center", "Cancellations", "Safety", "Accessibility"],
};

export default function Demo() {
  return (
    <div className="w-full overflow-hidden rounded-2xl shadow-[inset_0_0_0_1px_var(--pl-separator)]">
      <Footer
        brand={
          <>
            <span className="text-headline text-fg">Plate</span>
            <p>Plan trips together, from the first idea to the last photo.</p>
          </>
        }
      >
        <FooterColumns>
          {Object.entries(COLUMNS).map(([title, links]) => (
            <FooterColumn key={title} title={title}>
              {links.map((link) => (
                <FooterLink key={link} href="#basic">
                  {link}
                </FooterLink>
              ))}
            </FooterColumn>
          ))}
        </FooterColumns>
        <FooterBottom>
          <span>© 2026 Plate. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#basic" className="hover:text-fg">Privacy</a>
            <a href="#basic" className="hover:text-fg">Terms</a>
            <a href="#basic" className="hover:text-fg">Cookies</a>
          </div>
        </FooterBottom>
      </Footer>
    </div>
  );
}
