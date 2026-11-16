import type { ReactNode } from "react";
import type { InForce } from "@/model/financial-plans";
import { PageHeader } from "../page-header";
import { PlanStatus, type VersionState } from "../version-badge";
import type { PlanWarning } from "@/model/reports";
import { ReportNav, type Report } from "./report-nav";
import { WarningsBadge } from "./warnings-badge";

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
  /** Every warning the engine left on it, counted beside its name. */
  warnings?: PlanWarning[];
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
  warnings = [],
  children,
}: ReportPageProps) {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-card">
      <PageHeader
        title={name}
        badge={
          <span className="inline-flex items-center gap-2 self-center">
            <PlanStatus state={status} inForce={inForce} />
            <WarningsBadge setId={setId} warnings={warnings} />
          </span>
        }
        back={{ to: "/plans", label: "Planning" }}
        actions={actions}
      />
      <ReportNav setId={setId} reports={reports} current={current} />
      <div className="grid gap-12">{children}</div>
    </main>
  );
}

/** A titled part of a report, spaced well apart from the next, with any controls for it on the right. */
export function ReportSection({
  id,
  title,
  actions,
  children,
}: {
  id: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="grid gap-4">
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
