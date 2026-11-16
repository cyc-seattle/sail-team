import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { FinancialPlanActions } from "@/components/plans/financial-plan-actions";
import { OlderNumbers } from "@/components/plans/older-numbers";
import { NonProgramReport } from "@/components/plans/reports/non-program-report";
import { OverviewReport } from "@/components/plans/reports/overview-report";
import { ProgramAreaReport, type ProgramAreaReportProps } from "@/components/plans/reports/program-area-report";
import { PlanCalendar, type PlanCalendarProps } from "@/components/plans/reports/plan-calendar";
import { RatesReport } from "@/components/plans/reports/rates-report";
import { ReportPage } from "@/components/plans/reports/report-page";
import { NoAccess } from "@/components/shell/no-access";
import { NoticePage } from "@/components/shell/notice-page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { canAdminPlans, canRead, canUpdateFields, canWrite } from "@/directus/access";
import {
  engineQuery,
  startFinancialPlan,
  updateFinancialPlan,
  workOutAgain,
  type FinancialPlan,
} from "@/directus/financial-plans";
import { planInputsQuery, type PlanInputs } from "@/directus/plan-inputs";
import { useSession } from "@/directus/use-session";
import { useFinancialPlan } from "@/hooks/use-financial-plan";
import { fromOlderEngine } from "@/model/financial-plans";
import {
  capitalList,
  functionalExpenses,
  fundraisingOf,
  overviewRows,
  planWarnings,
  productsOf,
  reportKey,
  reportName,
  reportsOf,
  sharedCostsOf,
  statementOf,
  withResults,
  areaTotal,
  storageOf,
} from "@/model/reports";

/**
 * One report of a Financial Plan, by its key: `overview`, `calendar`, `rates`, a Program Plan's id, or `non-program`.
 */
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
  return <Found data={data} stuck={stuck} report={report} />;
}

function Found({ data, stuck, report }: { data: FinancialPlan; stuck: boolean; report: string }) {
  const { data: inputs } = useQuery(planInputsQuery(data.set, data.plans));
  const setId = data.set.id;
  const reports = reportsOf(data.plans);
  if (!reports.some((r) => r.key === report)) {
    return <NoticePage title="There's no such report in this Financial Plan" />;
  }
  return (
    <ReportPage
      setId={setId}
      name={data.set.name}
      status={data.set.status}
      inForce={data.inForce}
      reports={reports}
      current={report}
      actions={<Actions plan={data} />}
      warnings={data.results ? planWarnings(data.results.warnings, data.plans) : []}
    >
      <Older plan={data} />
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

/** Says a draft's numbers came from an older engine, and lets someone who can edit it recalculate them. */
function Older({ plan }: { plan: FinancialPlan }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const { data: engine } = useQuery(engineQuery);
  if (!fromOlderEngine(plan, engine)) {
    return null;
  }
  const permissions = session.kind === "signed-in" ? session.permissions : undefined;
  const canEdit = canUpdateFields(permissions, "financial_plans", ["name", "note"]);
  return (
    <OlderNumbers
      onWorkOut={
        canEdit
          ? async () => {
              await workOutAgain(plan.set.id);
              await queryClient.invalidateQueries({ queryKey: ["financial-plans"] });
            }
          : undefined
      }
    />
  );
}

/** What a report shows while platform calculates a draft's numbers, or once it's given up. */
function PendingNumbers({ stuck }: { stuck: boolean }) {
  return stuck ? (
    <Alert>
      <AlertDescription>
        Its numbers couldn't be calculated. Check its plans for a mistake, or change something to try again.
      </AlertDescription>
    </Alert>
  ) : (
    <p role="status" className="text-sm text-muted-foreground">
      Calculating…
    </p>
  );
}

function Report({ plan, inputs, report }: { plan: FinancialPlan; inputs: PlanInputs; report: string }): ReactNode {
  const { set, plans } = plan;
  const results = plan.results!;
  const warnings = planWarnings(results.warnings, plans);
  const operations = plans.find((p) => p.kind === "operations");
  if (report === "overview") {
    const rows = overviewRows(plans, results.lines, inputs.offerings);
    return (
      <OverviewReport
        setId={set.id}
        note={set.note}
        notes={inputs.notes["rates"] ?? null}
        rows={rows}
        offerings={Object.fromEntries(
          Object.entries(inputs.offerings).map(([key, own]) => [key, withResults(own, results.pnl)]),
        )}
        warnings={warnings}
        totals={results.totals}
        functions={functionalExpenses(results.lines)}
      />
    );
  }
  if (report === "calendar") {
    return (
      <CalendarReport
        areas={plans
          .filter((m) => m.kind === "program_area")
          .map((m) => ({
            key: reportKey(m),
            name: reportName(m),
            blocks: inputs.schedule[reportKey(m)] ?? [],
            offerings: inputs.offerings[reportKey(m)] ?? [],
          }))}
        closedDays={inputs.operations?.closedDays ?? []}
        warnings={warnings}
      />
    );
  }
  if (report === "rates") {
    return inputs.operations ? (
      <RatesReport assumptions={inputs.operations} storage={storageOf(results.lines, plans)} warnings={warnings} />
    ) : (
      <p className="text-sm text-muted-foreground">This Financial Plan has no Operations Plan yet.</p>
    );
  }
  if (report === "non-program") {
    return (
      <NonProgramReport
        products={productsOf(
          results.lines.filter((l) => l.plan === operations?.id),
          inputs.products,
        )}
        shared={sharedCostsOf(results.lines, operations?.id ?? null)}
        fundraising={fundraisingOf(results.lines)}
        capital={capitalList(results, inputs.capital)}
        warnings={warnings}
      />
    );
  }
  const area = plans.find((p) => p.kind === "program_area" && reportKey(p) === report)!;
  const offerings = withResults(inputs.offerings[report] ?? [], results.pnl);
  return (
    <AreaReport
      area={reportName(area)}
      notes={inputs.notes[report] ?? null}
      warnings={warnings}
      statement={statementOf(results.lines.filter((l) => l.plan === area.id))}
      total={areaTotal(results.pnl, area.program_area_id)}
      programs={inputs.programs[report] ?? []}
      offerings={offerings}
      areaKey={report}
      schedule={inputs.schedule[report] ?? []}
      closedDays={inputs.operations?.closedDays ?? []}

      trips={inputs.trips[report] ?? []}
      fixedCosts={inputs.fixedCosts[report] ?? []}
      staffTime={inputs.staffTime[report] ?? []}
    />
  );
}

const reportRoute = getRouteApi("/plans/financial/$setId/$planId");

/**
 * A program area's report, with its calendar's day kept in the address. Choosing a day keeps the page where it is: the
 * router would scroll to the top of a new address.
 */
function AreaReport(props: Omit<ProgramAreaReportProps, "day" | "onDayChange">) {
  const { day } = reportRoute.useSearch();
  const navigate = reportRoute.useNavigate();
  return (
    <ProgramAreaReport
      {...props}
      day={day ?? null}
      onDayChange={(next) => void navigate({ search: (s) => ({ ...s, day: next }), replace: true, resetScroll: false })}
    />
  );
}

/** The Calendar, with its day kept in the address. */
function CalendarReport(props: Pick<PlanCalendarProps, "areas" | "closedDays" | "warnings">) {
  const { day } = reportRoute.useSearch();
  const navigate = reportRoute.useNavigate();
  return (
    <PlanCalendar
      {...props}
      day={day ?? null}
      onDayChange={(next) => void navigate({ search: (s) => ({ ...s, day: next }), replace: true, resetScroll: false })}
    />
  );
}

/** The plan's buttons: edit its name and note, duplicate it, freeze it, and make it active from a date. */
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
      canEdit={canUpdateFields(permissions, "financial_plans", ["name", "note"])}
      canCreate={canWrite(permissions, "financial_plans", "create")}
      canAdmin={canAdminPlans(permissions)}
      onEdit={async ({ name, note }) => {
        await updateFinancialPlan(set.id, { name, note });
        await refresh();
      }}
      onStart={async (details) => {
        const id = await startFinancialPlan(plan, details);
        await refresh();
        await navigate({ to: "/plans/financial/$setId", params: { setId: id } });
      }}
      onFreeze={async () => {
        await updateFinancialPlan(set.id, { status: "frozen" });
        await refresh();
      }}
      onActivate={async (date) => {
        await updateFinancialPlan(set.id, { effective_from: date });
        await refresh();
      }}
    />
  );
}
