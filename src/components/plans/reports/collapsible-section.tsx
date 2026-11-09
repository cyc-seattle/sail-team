import { ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";

/** A titled part of a report that starts closed, opened from its title, for what's checked now and then. */
export function CollapsibleSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <details className="group">
      <summary className="flex min-h-tap cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon aria-hidden className="size-4 transition-transform group-open:rotate-90" />
        {icon}
        <h2 className="text-lg font-medium">{title}</h2>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
