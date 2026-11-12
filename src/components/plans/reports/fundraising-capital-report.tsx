import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AccountAmount } from "@/model/reports";
import { Money } from "../money";
import { ReportSection } from "./report-page";
import { AccountRows, StatementTable } from "./statement-table";

/** Fundraising's revenue and costs, and the capital purchases it pays for, both kept apart from the operating net. */
export function FundraisingCapitalReport({
  fundraising,
  capital,
}: {
  fundraising: { revenue: AccountAmount[]; costs: AccountAmount[] };
  capital: AccountAmount[];
}) {
  return (
    <>
      <ReportSection id="fundraising" title="Fundraising">
        <StatementTable
          label="Fundraising"
          sections={[
            { title: "Revenue", accounts: fundraising.revenue },
            { title: "Costs", accounts: fundraising.costs, leaves: "Net" },
          ]}
        />
      </ReportSection>
      <ReportSection id="capital" title="Capital">
        <Table aria-label="Capital">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Account</TableHead>
              <TableHead>
                <span className="sr-only">Purchase</span>
              </TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {capital.map((c) => (
              <AccountRows key={`${c.number} ${c.name}`} account={c} />
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow>
              <TableCell />
              <TableCell>Total</TableCell>
              <TableCell className="text-right">
                <Money cents={capital.reduce((total, c) => total + c.cents, 0)} whole />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </ReportSection>
    </>
  );
}
