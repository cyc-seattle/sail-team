import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AccountAmount, CapitalItem, PlanWarning, Product, SharedCost } from "@/model/reports";
import { about } from "@/model/warnings";
import { AccountTable } from "../account-table";
import { Money } from "../money";
import { WarningMark } from "../warning-mark";
import { FundraisingCapitalReport } from "./fundraising-capital-report";
import { ReportSection } from "./report-page";

const pinned = "sticky left-0 z-10 bg-background";

function Amount({ cents, colored = false }: { cents: number; colored?: boolean }) {
  return (
    <TableCell className="text-right">
      <Money cents={cents} colored={colored} whole />
    </TableCell>
  );
}

/** A shared cost's allocated and unallocated parts, and its total. */
const amounts = (c: Pick<SharedCost, "allocated_cents" | "total_cents">) => [
  <Money key="allocated" cents={c.allocated_cents} whole />,
  <Money key="unallocated" cents={c.total_cents - c.allocated_cents} whole />,
  <Money key="total" cents={c.total_cents} whole />,
];

const add = <T,>(rows: T[], of: (row: T) => number) => rows.reduce((total, r) => total + of(r), 0);

/**
 * What CSC sells outside the programs, which carries no shared costs, then each shared cost by account: the part
 * allocated to the programs, the part left unallocated, and its total. Then fundraising and capital, both kept apart
 * from the operating net.
 */
export function NonProgramReport({
  products,
  shared,
  fundraising,
  capital,
  warnings = [],
}: {
  products: Product[];
  shared: SharedCost[];
  fundraising: { revenue: AccountAmount[]; costs: AccountAmount[] };
  capital: { items: CapitalItem[]; available_cents: number };
  /** Every warning in the Financial Plan; each shows on the row it names. */
  warnings?: PlanWarning[];
}) {
  const total = {
    revenue_cents: add(products, (p) => p.revenue_cents),
    direct_cents: add(products, (p) => p.direct_cents),
  };
  const pools = [...new Set(shared.map((c) => c.pool))].sort((a, b) => a.localeCompare(b));
  return (
    <>
      <Table aria-label="Sold outside programs">
        <TableHeader>
          <TableRow>
            <TableHead className={pinned}>
              <span className="sr-only">What</span>
            </TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Direct costs</TableHead>
            <TableHead className="text-right">Net</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.name}>
              <TableCell className={pinned}>
                <span className="inline-flex items-center gap-1">
                  {p.name}
                  <WarningMark warnings={about(warnings, p.id)} />
                </span>
              </TableCell>
              <Amount cents={p.revenue_cents} />
              <Amount cents={p.direct_cents} />
              <Amount cents={p.revenue_cents - p.direct_cents} colored />
            </TableRow>
          ))}
        </TableBody>
        <TableFooter className="bg-transparent">
          <TableRow>
            <TableCell className={pinned}>Total</TableCell>
            <Amount cents={total.revenue_cents} />
            <Amount cents={total.direct_cents} />
            <Amount cents={total.revenue_cents - total.direct_cents} colored />
          </TableRow>
        </TableFooter>
      </Table>

      <ReportSection
        id="shared-costs"
        title="Shared costs"
        warnings={warnings.filter((w) => w.code === "no_shared_costs" || w.code === "pool_without_offerings")}
      >
        <AccountTable
          label="Shared costs"
          columns={[{ head: "Allocated" }, { head: "Unallocated" }, { head: "Total" }]}
          groups={pools.map((pool, i) => ({
            title: pool,
            rows: shared
              .filter((c) => c.pool === pool)
              .map((c) => ({
                key: `${c.number} ${c.name}`,
                number: c.number,
                name: c.name,
                values: amounts(c),
              })),
            ...(i === pools.length - 1 && {
              footers: [
                {
                  name: "Total",
                  values: amounts({
                    allocated_cents: add(shared, (c) => c.allocated_cents),
                    total_cents: add(shared, (c) => c.total_cents),
                  }),
                },
              ],
            }),
          }))}
        />
      </ReportSection>

      <FundraisingCapitalReport fundraising={fundraising} capital={capital} warnings={warnings} />
    </>
  );
}
