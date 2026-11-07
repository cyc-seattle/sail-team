import { Badge } from "@/components/ui/badge";

/** Whether a Financial Plan is a draft, saved, or the saved one that's active. */
export type VersionState = "draft" | "saved" | "active";

const labels: Record<VersionState, string> = { draft: "Draft", saved: "Saved", active: "Active" };
const variants = { draft: "secondary", saved: "outline", active: "default" } as const;

/** Whether a Financial Plan is a draft, saved, or the saved one that's active. */
export function VersionBadge({ state }: { state: VersionState }) {
  return <Badge variant={variants[state]}>{labels[state]}</Badge>;
}
