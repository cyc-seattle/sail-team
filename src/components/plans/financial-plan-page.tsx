import { FinancialPlanActions, type FinancialPlanActionsProps } from "./financial-plan-actions";
import { FinancialPlanView, type FinancialPlanViewProps } from "./financial-plan-view";
import { PageHeader } from "./page-header";

export type FinancialPlanPageProps = FinancialPlanViewProps & Omit<FinancialPlanActionsProps, "set">;

/** A Financial Plan's page: its name and buttons, then the plan. */
export function FinancialPlanPage({ canUpdate, canCreate, onEdit, onStart, onMove, ...plan }: FinancialPlanPageProps) {
  return (
    <main className="mx-auto max-w-6xl p-card">
      <PageHeader
        title={plan.set.name}
        back={{ to: "/plans", label: "Plans" }}
        actions={
          <FinancialPlanActions
            set={plan.set}
            canUpdate={canUpdate}
            canCreate={canCreate}
            onEdit={onEdit}
            onStart={onStart}
            onMove={onMove}
          />
        }
      />
      <FinancialPlanView {...plan} />
    </main>
  );
}
