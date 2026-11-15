import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { activeText, type InForce } from "@/model/financial-plans";

/** Whether a Financial Plan is a draft or frozen. */
export type VersionState = "draft" | "frozen";

const labels: Record<VersionState, string> = { draft: "Draft", frozen: "Frozen" };
const variants = { draft: "secondary", frozen: "outline" } as const;

/** Whether a Financial Plan is a draft or frozen. */
export function VersionBadge({ state }: { state: VersionState }) {
  return <Badge variant={variants[state]}>{labels[state]}</Badge>;
}

/** A plan's badge, with when it's active beside it, the plan active now in bold. */
export function PlanStatus({ state, inForce }: { state: VersionState; inForce: InForce | null }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <VersionBadge state={state} />
      {inForce && (
        <span
          className={cn("text-xs whitespace-nowrap", inForce.when === "now" ? "font-medium" : "text-muted-foreground")}
        >
          {activeText(inForce)}
        </span>
      )}
    </span>
  );
}
