import { ExternalLinkIcon, TriangleAlertIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AccountAmount, CapitalItem } from "@/model/reports";
import { Money } from "../money";
import { NoteInfo } from "../note-info";
import { ReportSection } from "./report-page";
import { StatementTable } from "./statement-table";

/** Fundraising's revenue and costs, and the capital purchases it pays for, both kept apart from the operating net. */
export function FundraisingCapitalReport({
  fundraising,
  capital,
}: {
  fundraising: { revenue: AccountAmount[]; costs: AccountAmount[] };
  capital: { items: CapitalItem[]; available_cents: number };
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
        <CapitalTable items={capital.items} />
      </ReportSection>
    </>
  );
}

/**
 * The planned purchases, most needed first, with a running total and a line where what's left after operations and
 * fundraising runs out. Capital entered as a budget line has no rank, so it comes last, with a warning.
 */
export function CapitalTable({ items }: { items: CapitalItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No capital purchases are planned.</p>;
  }
  const ranked = items.filter((i) => i.rank !== null);
  const unranked = items.filter((i) => i.rank === null);
  // The money runs out before the first item it doesn't cover, ranked or not.
  const runsOut = items.find((i) => !i.funded)?.key;
  const rows = (list: CapitalItem[]) =>
    list.map((item) => <ItemRow key={item.key} item={item} runsOut={item.key === runsOut} />);
  return (
    <Table aria-label="Capital">
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-right">Rank</TableHead>
          <TableHead>Item</TableHead>
          <TableHead>Account</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Running total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows(ranked)}
        {unranked.length > 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell />
            <TableCell colSpan={4} className="pt-6 font-medium">
              Not ranked
            </TableCell>
          </TableRow>
        )}
        {rows(unranked)}
        <TableRow className="font-medium">
          <TableCell />
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right">
            <Money cents={items.reduce((t, i) => t + i.amount_cents, 0)} whole />
          </TableCell>
          <TableCell />
        </TableRow>
      </TableBody>
    </Table>
  );
}

/** One purchase. The first the money doesn't cover has a line above it, and it and every one after it are muted. */
function ItemRow({ item, runsOut }: { item: CapitalItem; runsOut: boolean }) {
  return (
    <TableRow className={cn(!item.funded && "text-muted-foreground", runsOut && "border-t-2 border-t-warning")}>
      <TableCell className="text-right align-top tabular-nums">{item.rank}</TableCell>
      <TableCell className="whitespace-normal">
        <span className="flex items-center gap-1">
          {runsOut && <span className="sr-only">The money runs out here.</span>}
          {item.name}
          <NoteInfo note={item.note} />
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              aria-label={`${item.name}: quote or listing`}
              className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <ExternalLinkIcon aria-hidden className="size-3.5" />
            </a>
          )}
        </span>
        {item.rank === null && (
          <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <TriangleAlertIcon aria-hidden className="size-3.5 text-warning" />
            Entered as a budget line, so it has no rank. Add it to the capital list to rank it.
          </span>
        )}
      </TableCell>
      <TableCell className="align-top">
        <span className="text-muted-foreground tabular-nums">{item.account_number}</span> {item.account_name}
      </TableCell>
      <TableCell className="text-right align-top">
        <Money cents={item.amount_cents} whole />
      </TableCell>
      <TableCell className="text-right align-top">
        <Money cents={item.running_cents} whole />
      </TableCell>
    </TableRow>
  );
}
