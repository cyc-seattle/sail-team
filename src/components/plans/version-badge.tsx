import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { inForceText, type InForce } from "@/model/financial-plans";

/** Whether a Financial Plan is a draft or saved. Saved ones are called frozen. */
export type VersionState = "draft" | "saved";

const labels: Record<VersionState, string> = { draft: "Draft", saved: "Frozen" };
const variants = { draft: "secondary", saved: "outline" } as const;

/** Whether a Financial Plan is a draft or frozen. */
export function VersionBadge({ state }: { state: VersionState }) {
  return <Badge variant={variants[state]}>{labels[state]}</Badge>;
}

/** A plan's badge, with when it's in force beside it, the plan in force in bold. */
export function PlanStatus({ state, inForce }: { state: VersionState; inForce: InForce | null }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <VersionBadge state={state} />
      {inForce && (
        <span
          className={cn("text-xs whitespace-nowrap", inForce.when === "now" ? "font-medium" : "text-muted-foreground")}
        >
          {inForceText(inForce)}
        </span>
      )}
    </span>
  );
}
