import { Fragment } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AccountAmount } from "@/model/reports";
import { Money } from "../money";

export interface StatementSection {
  title: string;
  accounts: AccountAmount[];
  /** For a cost section, the name of what's left after it, such as Contribution or Net. */
  leaves?: string;
}

const sum = (accounts: AccountAmount[]) => accounts.reduce((total, a) => total + a.cents, 0);

/**
 * Accounts from revenue down to net, each account's number in its own column. The first section is revenue; each later
 * one is a cost, taken away, with what's left after it on its own line, so every step adds up on the page.
 */
export function StatementTable({ label, sections }: { label: string; sections: StatementSection[] }) {
  const totals = sections.map((s) => sum(s.accounts));
  // What's left after each section: revenue, less every cost section so far.
  const left = totals.map((_, i) => totals[0]! - totals.slice(1, i + 1).reduce((a, b) => a + b, 0));
  return (
    <Table aria-label={label}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Account</TableHead>
          <TableHead>
            <span className="sr-only">Name</span>
          </TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sections.map((section, i) => {
          const total = totals[i]!;
          return (
            <Fragment key={section.title}>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="pt-6 font-medium">
                  {section.title}
                </TableCell>
              </TableRow>
              {section.accounts.map((a) => (
                <TableRow key={`${a.number} ${a.name}`}>
                  <TableCell className="text-muted-foreground tabular-nums">{a.number}</TableCell>
                  <TableCell className="whitespace-normal">{a.name}</TableCell>
                  <TableCell className="text-right">
                    <Money cents={a.cents} whole />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-medium">
                <TableCell />
                <TableCell>Total {section.title.toLowerCase()}</TableCell>
                <TableCell className="text-right">
                  <Money cents={total} whole />
                </TableCell>
              </TableRow>
              {section.leaves && (
                <TableRow className="bg-muted/50 font-semibold hover:bg-muted/50">
                  <TableCell />
                  <TableCell>{section.leaves}</TableCell>
                  <TableCell className="text-right">
                    <Money cents={left[i]!} colored whole />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
