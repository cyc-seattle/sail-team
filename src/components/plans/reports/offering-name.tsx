import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDays } from "@/model/dates";
import type { NumberedOffering } from "@/model/reports";

/** An offering's number, such as Guppies 3, showing its session and dates on hover, or on a tap on a phone. */
export function OfferingName({ offering }: { offering: NumberedOffering }) {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={100}
        className="cursor-default underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {offering.label}
      </PopoverTrigger>
      <PopoverContent side="top" className="w-auto" aria-label={`${offering.label} dates`}>
        <p className="font-medium">{offering.session}</p>
        <p className="tabular-nums">{formatDays(offering.starts_on, offering.ends_on)}</p>
      </PopoverContent>
    </Popover>
  );
}
