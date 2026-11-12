import type { AccountAmount } from "@/model/reports";
import { AccountTable } from "../account-table";
import { Money } from "../money";
import { ReportSection } from "./report-page";
import { accountRow } from "./account-row";
import { StatementTable } from "./statement-table";

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
        <AccountTable
          label="Capital"
          columns={[{ head: "Amount" }]}
          groups={[
            {
              rows: capital.map(accountRow),
              footers: [
                {
                  name: "Total",
                  values: [<Money key="total" cents={capital.reduce((total, c) => total + c.cents, 0)} whole />],
                },
              ],
            },
          ]}
        />
      </ReportSection>
    </>
  );
}
