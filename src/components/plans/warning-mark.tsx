import { OctagonAlertIcon, TriangleAlertIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PlanWarning } from "@/model/reports";
import { bySeverity, warningCount, worstOf } from "@/model/warnings";
import { cn } from "@/lib/utils";

/** An error's or a warning's icon, in its color. */
export function SeverityIcon({ severity, className }: { severity: "error" | "warning"; className?: string }) {
  const Icon = severity === "error" ? OctagonAlertIcon : TriangleAlertIcon;
  return (
    <Icon
      aria-hidden
      className={cn("size-3.5 shrink-0", severity === "error" ? "text-destructive" : "text-warning", className)}
    />
  );
}

/** Warnings as a list, errors first, each with its icon. */
export function WarningList({ warnings, className }: { warnings: PlanWarning[]; className?: string }) {
  return (
    <ul className={cn("grid gap-1.5", className)}>
      {[...warnings].sort(bySeverity).map((w) => (
        <li key={w.key} className="flex gap-1.5">
          <SeverityIcon severity={w.severity} className="mt-0.5" />
          <span>{w.message}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The engine's warnings about one thing, behind an icon beside it, in the worst one's color: shown on hover, or on a tap
 * on a phone. Nothing when there are none.
 */
export function WarningMark({ warnings, className }: { warnings: PlanWarning[]; className?: string }) {
  const worst = worstOf(warnings);
  if (!worst) {
    return null;
  }
  const label = warningCount(warnings);
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={100}
        aria-label={label}
        className={cn(
          "inline-flex size-5 shrink-0 cursor-default items-center justify-center rounded-full align-middle outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          className,
        )}
      >
        <SeverityIcon severity={worst} />
      </PopoverTrigger>
      <PopoverContent side="top" className="w-auto max-w-sm font-normal whitespace-normal" aria-label={label}>
        <WarningList warnings={warnings} />
      </PopoverContent>
    </Popover>
  );
}
