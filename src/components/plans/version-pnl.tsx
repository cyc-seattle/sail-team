import type { EngineWarning, Pnl } from "@cyc-seattle/platform/planning";
import type { ReactNode } from "react";
import type { PlanLine } from "@/model/financial-plans";
import { sumPnl } from "@/model/pnl-view";
import { ChartCard } from "./chart-card";
import { EngineWarnings } from "./engine-warnings";
import { LinesTable } from "./lines-table";
import { Money } from "./money";
import { PnlTable, type PnlRow } from "./pnl-table";
import { RevenueExpenseChart } from "./revenue-expense-chart";
import { SummaryTiles } from "./summary-tiles";

export interface VersionPnlProps {
  /** Where the numbers come from: as saved, or calculated now. */
  note: ReactNode;
  rows: PnlRow[];
  warnings: EngineWarning[];
  /** Each line, such as coach wages or a share of the office. */
  lines?: Pick<PlanLine, "name" | "cost_center_name" | "amount_cents" | "revenue">[];
}

const levels: { level: Pnl["level"]; title: string; label: string }[] = [
  { level: "program_area", title: "Program area", label: "Program area" },
  { level: "product", title: "By product", label: "Product" },
  { level: "offering", title: "By offering", label: "Offering" },
];

/** A plan's P&L: its totals, what to check, each offering, product, and area, and then each line. */
export function VersionPnl({ note, rows, warnings, lines = [] }: VersionPnlProps) {
  const at = (level: Pnl["level"]) => rows.filter((r) => r.pnl.level === level);
  // The broadest level there is: an area's totals include the costs shared among its offerings.
  const top = levels.map((l) => at(l.level)).find((r) => r.length > 0) ?? [];
  const total = sumPnl(
    top.map((r) => r.pnl),
    "total",
  );
  const offerings = at("offering");
  return (
    <div className="grid gap-card">
      {note}
      <SummaryTiles
        tiles={[
          { label: "Revenue", value: <Money cents={total.revenue_cents} /> },
          { label: "Expenses", value: <Money cents={total.expense_cents} /> },
          { label: "Net", value: <Money cents={total.net_cents} colored /> },
          { label: "Sailor-days", value: <span className="tabular-nums">{total.sailor_days}</span> },
        ]}
      />
      <EngineWarnings warnings={warnings} />
      {offerings.length > 0 && (
        <ChartCard
          title="Revenue and expenses by offering"
          explanation="Each offering's revenue against its costs, including its share of the costs its program area shares."
          chart={<RevenueExpenseChart bars={offerings.map((r) => ({ name: r.name, ...r.pnl }))} />}
          table={<PnlTable rows={offerings} label="Offering" />}
        />
      )}
      {levels
        .filter((l) => l.level !== "offering" && at(l.level).length > 0)
        .map((l) => (
          <section key={l.level} aria-labelledby={`pnl-${l.level}`} className="grid gap-2">
            <h2 id={`pnl-${l.level}`} className="text-base font-medium">
              {l.title}
            </h2>
            <PnlTable rows={at(l.level)} label={l.label} />
          </section>
        ))}
      {lines.length > 0 && (
        <section aria-labelledby="pnl-lines" className="grid gap-2">
          <h2 id="pnl-lines" className="text-base font-medium">
            Every line
          </h2>
          <LinesTable lines={lines} />
        </section>
      )}
    </div>
  );
}
