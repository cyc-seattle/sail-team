import type { ReactNode } from "react";
import type { InForce } from "@/model/financial-plans";
import { PageHeader } from "../page-header";
import { PlanStatus, type VersionState } from "../version-badge";
import { ReportNav, type Report } from "./report-nav";

/**
 * A report's sections in two columns on a laptop: each spans both unless it's `data-half`, so tables line up as columns
 * instead of each being its own width. One column on a phone.
 */
export const reportColumns =
  "grid items-start gap-x-8 gap-y-10 lg:grid-cols-2 *:min-w-0 lg:*:col-span-2 lg:*:data-half:col-span-1";

export interface ReportPageProps {
  setId: string;
  /** The Financial Plan's name, such as Budget. */
  name: string;
  status: VersionState;
  /** When it's in force, or null when it's never been made active. */
  inForce?: InForce | null;
  reports: Report[];
  current: string;
  /** The plan's buttons, on the right. */
  actions?: ReactNode;
  children: ReactNode;
}

/** One report of a Financial Plan: its name with its status beside it, its buttons, the report switcher, then the report's sections. */
export function ReportPage({
  setId,
  name,
  status,
  inForce = null,
  reports,
  current,
  actions,
  children,
}: ReportPageProps) {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-card">
      <PageHeader
        title={name}
        badge={<PlanStatus state={status} inForce={inForce} />}
        back={{ to: "/plans", label: "Planning" }}
        actions={actions}
      />
      <ReportNav setId={setId} reports={reports} current={current} />
      <div className={reportColumns}>{children}</div>
    </main>
  );
}

/**
 * A titled part of a report, spaced well apart from the next, with any controls for it on the right. A `half` one
 * takes one of the two columns, for a table with a column or two of values.
 */
export function ReportSection({
  id,
  title,
  actions,
  half = false,
  children,
}: {
  id: string;
  title: string;
  actions?: ReactNode;
  half?: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} data-half={half || undefined} className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="text-lg font-medium">
          {title}
        </h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
