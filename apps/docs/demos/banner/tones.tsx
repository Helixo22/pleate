import { Banner } from "pleate/banner";

export default function Demo() {
  return (
    <div className="pl-field grid w-full overflow-hidden rounded-md p-px">
      <Banner aria-label="Maintenance">Booking changes are paused on 4 November from 02:00 to 03:00 UTC.</Banner>
      <Banner tone="warning" aria-label="Strike notice" action={<a href="#" className="pl-focus-ring rounded-xs font-medium underline underline-offset-2">Check your trains</a>}>
        Rail strike in Portugal on 7 November. Some connections may not run.
      </Banner>
      <Banner tone="danger" aria-label="Payment issue" action={<a href="#" className="pl-focus-ring rounded-xs font-medium underline underline-offset-2">Update card</a>}>
        Your card was declined. The Lisbon hotel hold ends in 2 hours.
      </Banner>
    </div>
  );
}
