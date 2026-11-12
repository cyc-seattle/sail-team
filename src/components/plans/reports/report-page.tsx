import type { ReactNode } from "react";
import { PageHeader } from "../page-header";
import { VersionBadge, type VersionState } from "../version-badge";
import { ReportNav, type Report } from "./report-nav";

export interface ReportPageProps {
  setId: string;
  /** The Financial Plan's name, such as Budget. */
  name: string;
  status: VersionState;
  reports: Report[];
  current: string;
  /** The plan's buttons, on the right. */
  actions?: ReactNode;
  children: ReactNode;
}

/** One report of a Financial Plan: its name with its status beside it, its buttons, the report switcher, then the report's sections. */
export function ReportPage({ setId, name, status, reports, current, actions, children }: ReportPageProps) {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-card">
      <PageHeader
        title={name}
        badge={<VersionBadge state={status} />}
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
