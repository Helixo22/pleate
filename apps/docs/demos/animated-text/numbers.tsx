import { CountUp, DecryptedText } from "pleate/effects/animated-text";

export default function Demo() {
  return (
    <div className="grid w-full gap-10">
      <div className="grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
        <div>
          <p className="text-display-sm"><CountUp to={128400} format={{ notation: "compact" }} /></p>
          <p className="text-subhead text-fg-muted">travellers</p>
        </div>
        <div>
          <p className="text-display-sm"><CountUp to={4.9} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} /></p>
          <p className="text-subhead text-fg-muted">average rating</p>
        </div>
        <div>
          <p className="text-display-sm"><CountUp to={2.4e6} format={{ style: "currency", currency: "EUR", notation: "compact" }} /></p>
          <p className="text-subhead text-fg-muted">saved on bookings</p>
        </div>
      </div>
      <div className="grid gap-3 text-center">
        <p className="font-mono text-title2"><DecryptedText text="CONFIRMATION HT-2041" /></p>
        <p className="text-subhead text-fg-muted">
          Hover me: <DecryptedText text="booking secured" trigger="hover" className="font-semibold text-fg" />
        </p>
      </div>
    </div>
  );
}
