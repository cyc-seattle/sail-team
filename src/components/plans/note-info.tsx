import { InfoIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * A note, behind an info icon beside what it's about: shown on hover, or on a tap on a phone. Nothing when there's no
 * note.
 */
export function NoteInfo({
  note,
  label = "Note",
  className,
}: {
  note: string | null | undefined;
  label?: string;
  className?: string;
}) {
  if (!note) {
    return null;
  }
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={100}
        aria-label={label}
        className={cn(
          "inline-flex size-5 shrink-0 cursor-default items-center justify-center rounded-full align-middle text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
          className,
        )}
      >
        <InfoIcon aria-hidden className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent side="top" className="w-auto max-w-xs whitespace-normal" aria-label={label}>
        {note}
      </PopoverContent>
    </Popover>
  );
}
