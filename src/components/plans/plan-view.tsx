import type { EngineWarning } from "@cyc-seattle/platform/planning";
import type { ReactNode } from "react";
import type { Assumptions } from "@/model/assumptions";
import type { PlanLine } from "@/model/financial-plans";
import { categories, statement } from "@/model/plan-lines";
import type { Measures } from "@/model/pnl-view";
import { OfferingAssumptionsTable, OperationsAssumptionsView } from "./assumptions";
import { EngineWarnings } from "./engine-warnings";
import { LinesTable } from "./lines-table";
import { PnlTable, type PnlRow } from "./pnl-table";

export interface PlanViewProps {
  /** Where the numbers come from: as saved, or calculated now. */
  note: ReactNode;
  warnings: EngineWarning[];
  /** Its lines, such as coach wages, and, in a Program Plan, its share of the shared costs. */
  lines: PlanLine[];
  /** For the Operations Plan: the shared costs it holds, each at its full amount. */
  shared?: PlanLine[] | undefined;
  /** Each of its offerings' revenue, costs, and net. */
  offerings: PnlRow[];
  /** Still loading when not given. */
  assumptions?: Assumptions | undefined;
  /** What a per-day or per-sailor-day amount divides by. */
  measures: Measures;
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-2">
      <h2 id={id} className="text-lg font-medium">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** One plan in a Financial Plan: what to check, its assumptions, its revenue and costs by category, and its offerings. */
export function PlanView({ note, warnings, lines, shared, offerings, assumptions, measures }: PlanViewProps) {
  const { revenue, costs } = statement(lines);
  const programOf = new Map(assumptions?.offerings.map((o) => [o.key, o.program]));
  const programs = [...new Set(offerings.map((o) => programOf.get(o.pnl.key) ?? "Other"))].sort();
  const operations = assumptions?.operations;
  return (
    <div className="grid gap-card">
      {note}
      <EngineWarnings warnings={warnings} />
      <Section id="assumptions" title="Assumptions">
        {!assumptions ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {operations && <OperationsAssumptionsView assumptions={operations} />}
            {assumptions.offerings.length > 0 && (
              <>
                {operations && <h3 className="text-sm font-medium">Offerings outside any program area</h3>}
                <OfferingAssumptionsTable offerings={assumptions.offerings} />
              </>
            )}
            {!operations && assumptions.offerings.length === 0 && (
              <p className="text-sm text-muted-foreground">It has no offerings yet.</p>
            )}
          </>
        )}
      </Section>
      <Section id="revenue-and-costs" title="Revenue and costs">
        <LinesTable
          label="Revenue and costs"
          sections={[
            { title: "Revenue", categories: revenue },
            { title: "Costs", categories: costs },
          ]}
          measures={measures}
          net
        />
      </Section>
      {shared && shared.length > 0 && (
        <Section id="shared-costs" title="Shared costs">
          <p className="text-sm text-muted-foreground">Divided among every program&apos;s offerings.</p>
          <LinesTable
            label="Shared costs"
            sections={[{ title: "Shared costs", categories: categories(shared) }]}
            measures={measures}
          />
        </Section>
      )}
      {offerings.length > 0 && (
        <Section id="offerings" title="Offerings">
          <PnlTable
            rows={offerings}
            label="Offering"
            groups={programs.map((name) => ({
              name,
              rows: offerings.filter((o) => (programOf.get(o.pnl.key) ?? "Other") === name),
            }))}
          />
        </Section>
      )}
    </div>
  );
}
