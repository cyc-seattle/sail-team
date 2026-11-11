import { ChevronRightIcon } from "lucide-react";
import { Fragment, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AccountAmount, LineAmount } from "@/model/reports";
import { Money } from "../money";

export interface StatementSection {
  title: string;
  accounts: AccountAmount[];
  /** For a cost section, the name of what's left after it, such as Gross or Net. */
  leaves?: string;
}

// A budget line's explanation is only its own name again.
const explained = (line: LineAmount) => line.explanation !== null && line.explanation !== line.name;

/** Whether an account's lines say more than its own row does. */
const hasDetail = (account: AccountAmount) =>
  !!account.lines?.some((l) => l.name !== account.name || l.offerings > 1 || explained(l));

/**
 * One account's row, which opens to the lines it adds up when they say more than it does: each line's name, how many
 * offerings it's on, how the engine worked it out, and its amount.
 */
export function AccountRows({ account }: { account: AccountAmount }) {
  const [open, setOpen] = useState(false);
  const detail = hasDetail(account);
  return (
    <>
      <TableRow>
        <TableCell className="text-muted-foreground tabular-nums">{account.number}</TableCell>
        <TableCell className="whitespace-normal">
          {detail ? (
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              className="inline-flex min-h-tap items-center gap-1 text-left md:min-h-0"
            >
              <ChevronRightIcon
                aria-hidden
                className={cn("size-4 shrink-0 transition-transform", open && "rotate-90")}
              />
              {account.name}
            </button>
          ) : (
            <span className="block pl-5">{account.name}</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          <Money cents={account.cents} whole />
        </TableCell>
      </TableRow>
      {open &&
        account.lines?.map((line) => (
          <TableRow key={`${line.name} ${line.explanation}`} className="text-muted-foreground hover:bg-transparent">
            <TableCell />
            <TableCell className="pl-7 whitespace-normal">
              <div className="text-foreground">
                {line.name}
                {line.offerings > 1 && `, ${line.offerings} offerings`}
              </div>
              {explained(line) && <div className="text-xs">{line.explanation}</div>}
            </TableCell>
            <TableCell className="text-right align-top">
              <Money cents={line.cents} whole />
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}

const sum = (accounts: AccountAmount[]) => accounts.reduce((total, a) => total + a.cents, 0);

/**
 * Accounts from revenue down to net, each account's number in its own column. The first section is revenue; each later
 * one is a cost, taken away, with what's left after it on its own line, so every step adds up on the page. Each account
 * opens to the lines it adds up.
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
                <AccountRows key={`${a.number} ${a.name}`} account={a} />
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
