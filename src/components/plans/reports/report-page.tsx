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
  children: ReactNode;
}

/** One report of a Financial Plan: its name and status, the report switcher, then the report's sections. */
export function ReportPage({ setId, name, status, reports, current, children }: ReportPageProps) {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-card">
      <PageHeader title={name} back={{ to: "/plans", label: "Planning" }} actions={<VersionBadge state={status} />} />
      <ReportNav setId={setId} reports={reports} current={current} />
      <div className="grid gap-12">{children}</div>
    </main>
  );
}

/** A titled part of a report, spaced well apart from the next. */
export function ReportSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-4">
      <h2 id={id} className="text-lg font-medium">
        {title}
      </h2>
      {children}
    </section>
  );
}
