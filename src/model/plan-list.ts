import type { PlanSummary, VersionSummary } from "@/directus/plans";

/** Plans grouped by year, newest year first, each year's plans by name with the Operations Plan last. */
export function plansByYear(plans: PlanSummary[]): { year: number; plans: PlanSummary[] }[] {
  const years = [...new Set(plans.map((p) => p.fiscal_year))].sort((a, b) => b - a);
  return years.map((year) => ({
    year,
    plans: plans
      .filter((p) => p.fiscal_year === year)
      .sort(
        (a, b) => Number(a.kind === "operations") - Number(b.kind === "operations") || a.name.localeCompare(b.name),
      ),
  }));
}

/** What a plan is for: its program area, or the Operations Plan. */
export function planFor(plan: PlanSummary): string {
  return plan.kind === "operations" ? "Operations Plan" : (plan.area_name ?? "No program area");
}

/** Versions newest first: the draft, then saved versions from the latest save back. */
export function newestFirst(versions: VersionSummary[]): VersionSummary[] {
  return [...versions].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "draft" ? -1 : 1;
    }
    return (b.saved_at ?? "").localeCompare(a.saved_at ?? "");
  });
}

/** Whether a version is the draft, a saved version, or the saved version that's active. */
export type VersionState = "draft" | "saved" | "active";

export function stateOf(version: VersionSummary, activeId: string | null): VersionState {
  return version.status === "draft" ? "draft" : version.id === activeId ? "active" : "saved";
}
