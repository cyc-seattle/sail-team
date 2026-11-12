import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { FinancialPlanActions } from "@/components/plans/financial-plan-actions";
import { FundraisingCapitalReport } from "@/components/plans/reports/fundraising-capital-report";
import { NonProgramReport } from "@/components/plans/reports/non-program-report";
import { OverviewReport } from "@/components/plans/reports/overview-report";
import { ProgramAreaReport } from "@/components/plans/reports/program-area-report";
import { RatesReport } from "@/components/plans/reports/rates-report";
import { ReportPage } from "@/components/plans/reports/report-page";
import { NoAccess } from "@/components/shell/no-access";
import { NoticePage } from "@/components/shell/notice-page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { canRead, canWrite } from "@/directus/access";
import { startFinancialPlan, updateFinancialPlan, type FinancialPlan } from "@/directus/financial-plans";
import { planInputsQuery, type PlanInputs } from "@/directus/plan-inputs";
import { useSession } from "@/directus/use-session";
import { useFinancialPlan } from "@/hooks/use-financial-plan";
import {
  fundraisingAndCapital,
  overviewRows,
  planWarnings,
  productsOf,
  reportKey,
  reportName,
  reportsOf,
  sharedCostsOf,
  statementOf,
} from "@/model/reports";
import { programsByWeek } from "@/model/schedule";

/** One report of a Financial Plan, by its key: `overview`, `rates`, a Program Plan's id, `non-program` or `fundraising`. */
export function PlanReport({ setId, report }: { setId: string; report: string }) {
  const session = useSession();
  if (session.kind !== "signed-in" || !canRead(session.permissions, "plans")) {
    return <NoAccess what="plans" />;
  }
  return <Loaded setId={setId} report={report} />;
}

function Loaded({ setId, report }: { setId: string; report: string }) {
  const { data, stuck } = useFinancialPlan(setId);
  if (!data) {
    return <NoticePage title="There's no such Financial Plan" />;
  }
  // The Operations Plan's old address, by its plan's id, is Non-program's now.
  const operations = data.members.find((m) => m.kind === "operations" && m.plan_id === report);
  return <Found data={data} stuck={stuck} report={operations ? "non-program" : report} />;
}

function Found({ data, stuck, report }: { data: FinancialPlan; stuck: boolean; report: string }) {
  const { data: inputs } = useQuery(planInputsQuery(data.set, data.members));
  const setId = data.set.id;
  const reports = reportsOf(data.members);
  if (!reports.some((r) => r.key === report)) {
    return <NoticePage title="There's no such report in this Financial Plan" />;
  }
  return (
    <ReportPage
      setId={setId}
      name={data.set.name}
      status={data.set.status}
      reports={reports}
      current={report}
      actions={<Actions plan={data} />}
    >
      {!data.results ? (
        <PendingNumbers stuck={stuck} />
      ) : !inputs ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading…
        </p>
      ) : (
        <Report plan={data} inputs={inputs} report={report} />
      )}
    </ReportPage>
  );
}

/** What a report shows while platform works out a draft's numbers, or once it's given up. */
function PendingNumbers({ stuck }: { stuck: boolean }) {
  return stuck ? (
    <Alert>
      <AlertDescription>
        Its numbers couldn't be worked out. Check its plans for a mistake, or change something to try again.
      </AlertDescription>
    </Alert>
  ) : (
    <p role="status" className="text-sm text-muted-foreground">
      Working out its numbers…
    </p>
  );
}

function Report({ plan, inputs, report }: { plan: FinancialPlan; inputs: PlanInputs; report: string }): ReactNode {
  const { set, members } = plan;
  const results = plan.results!;
  const warnings = planWarnings(results.warnings, members);
  const operations = members.find((m) => m.kind === "operations");
  if (report === "overview") {
    const rows = overviewRows(members, results.lines, inputs.offerings);
    return <OverviewReport setId={set.id} rows={rows} offerings={inputs.offerings} warnings={warnings} />;
  }
  if (report === "rates") {
    return inputs.operations ? (
      <RatesReport assumptions={inputs.operations} rules={inputs.rules["rates"] ?? null} />
    ) : (
      <p className="text-sm text-muted-foreground">This Financial Plan has no Operations Plan yet.</p>
    );
  }
  if (report === "fundraising") {
    return <FundraisingCapitalReport {...fundraisingAndCapital(results.lines)} />;
  }
  if (report === "non-program") {
    return (
      <NonProgramReport
        products={productsOf(
          results.lines.filter((l) => l.member === operations?.id),
          inputs.products,
        )}
        shared={sharedCostsOf(results.lines, operations?.id ?? null)}
      />
    );
  }
  const member = members.find((m) => m.kind === "program_area" && reportKey(m) === report)!;
  return (
    <ProgramAreaReport
      area={reportName(member)}
      rules={inputs.rules[report] ?? null}
      warnings={warnings.filter((w) => w.area === report)}
      statement={statementOf(results.lines.filter((l) => l.member === member.id))}
      programs={inputs.programs[report] ?? []}
      offerings={inputs.offerings[report] ?? []}
      schedule={{
        blocks: inputs.schedule[report] ?? [],
        closedDays: inputs.operations?.closedDays ?? [],
        elsewhere: members
          .filter((m) => m.kind === "program_area" && m.id !== member.id)
          .map((m) => ({
            area: reportName(m),
            weeks: programsByWeek(inputs.schedule[reportKey(m)] ?? [], inputs.offerings[reportKey(m)] ?? []),
          })),
      }}
      trips={inputs.trips[report] ?? []}
      fixedCosts={inputs.fixedCosts[report] ?? []}
      staffTime={inputs.staffTime[report] ?? []}
    />
  );
}

/** The plan's buttons: edit its name and note, start a draft from it, and save it or mark it active. */
function Actions({ plan }: { plan: FinancialPlan }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const permissions = session.kind === "signed-in" ? session.permissions : undefined;
  const { set } = plan;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["financial-plans"] });
  return (
    <FinancialPlanActions
      set={set}
      canUpdate={canWrite(permissions, "version_sets", "update")}
      canCreate={canWrite(permissions, "version_sets", "create")}
      onEdit={async ({ name, message }) => {
        await updateFinancialPlan(set.id, { name, message });
        await refresh();
      }}
      onStart={async (details) => {
        const id = await startFinancialPlan(plan, details);
        await refresh();
        await navigate({ to: "/plans/financial/$setId", params: { setId: id } });
      }}
      onMove={async (status) => {
        await updateFinancialPlan(set.id, { status });
        await refresh();
      }}
    />
  );
}
