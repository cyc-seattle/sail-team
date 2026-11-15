import { SectionNav } from "@/components/section-nav";

export interface Report {
  /** `overview`, or the rest of its address, such as a plan's id or `non-program`. */
  key: string;
  name: string;
}

function linkProps(setId: string, key: string) {
  return key === "overview"
    ? { to: "/plans/financial/$setId", params: { setId } }
    : { to: "/plans/financial/$setId/$planId", params: { setId, planId: key } };
}

/** A Financial Plan's reports, as a section's pages. */
export function ReportNav({ setId, reports, current }: { setId: string; reports: Report[]; current: string }) {
  return (
    <SectionNav label="Reports" pages={reports.map((r) => ({ ...r, ...linkProps(setId, r.key) }))} current={current} />
  );
}
