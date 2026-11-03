import { Badge } from "@/components/ui/badge";
import type { VersionState } from "@/model/plan-list";

export type { VersionState };

const labels: Record<VersionState, string> = { draft: "Draft", saved: "Saved", active: "Active" };
const variants = { draft: "secondary", saved: "outline", active: "default" } as const;

/** Whether a version is the draft, a saved version, or the saved version that's active. */
export function VersionBadge({ state }: { state: VersionState }) {
  return <Badge variant={variants[state]}>{labels[state]}</Badge>;
}
