import type { AccountAmount } from "@/model/reports";
import { AccountTable } from "../account-table";
import { Money } from "../money";
import { accountRow } from "./account-row";

export interface StatementSection {
  title: string;
  accounts: AccountAmount[];
  /** For a cost section, the name of what's left after it, such as Gross or Net. */
  leaves?: string;
}

const sum = (accounts: AccountAmount[]) => accounts.reduce((total, a) => total + a.cents, 0);

/**
 * Accounts from revenue down to net. The first section is revenue; each later one is a cost, taken away, with what's
 * left after it on its own line, so every step adds up on the page.
 */
export function StatementTable({ label, sections }: { label: string; sections: StatementSection[] }) {
  const totals = sections.map((s) => sum(s.accounts));
  // What's left after each section: revenue, less every cost section so far.
  const left = totals.map((_, i) => totals[0]! - totals.slice(1, i + 1).reduce((a, b) => a + b, 0));
  return (
    <AccountTable
      label={label}
      columns={[{ head: "Amount" }]}
      groups={sections.map((section, i) => ({
        title: section.title,
        rows: section.accounts.map(accountRow),
        footers: [
          { name: `Total ${section.title.toLowerCase()}`, values: [<Money key="total" cents={totals[i]!} whole />] },
          ...(section.leaves
            ? [{ name: section.leaves, values: [<Money key="left" cents={left[i]!} colored whole />], result: true }]
            : []),
        ],
      }))}
    />
  );
}
