import { ChevronRightIcon } from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { NoteInfo } from "./note-info";

/** A column after the account's name: a number, on the right, unless it's `text`. */
export interface AccountColumn {
  head: string;
  text?: boolean;
}

/** One of the lines an account adds up. */
export interface AccountLine {
  key: string;
  name: string;
  /** How it was worked out, under its name. */
  detail?: string | null;
  values: ReactNode[];
}

/** One account's row: its number, its name, then a value for each column. */
export interface AccountTableRow {
  key: string;
  /** Its number in the chart of accounts. None for a share of a pool, such as G&A. */
  number: string | null;
  name: string;
  note?: string | null;
  values: ReactNode[];
  /** The lines it adds up, which it opens to. */
  lines?: AccountLine[];
}

/** A row after a group's accounts: its total, or what's left after it, such as Net. */
export interface AccountTableFooter {
  name: string;
  values: ReactNode[];
  /** A result, such as Net, stands out more than a total. */
  result?: boolean;
}

export interface AccountTableGroup {
  /** Its heading, such as Revenue or G&A. */
  title?: string;
  rows: AccountTableRow[];
  footers?: AccountTableFooter[];
}

function Values({ columns, values }: { columns: AccountColumn[]; values: ReactNode[] }) {
  return columns.map((c, i) => (
    <TableCell key={c.head} className={cn("align-top", !c.text && "text-right tabular-nums")}>
      {values[i]}
    </TableCell>
  ));
}

function AccountRows({
  row,
  columns,
  indent,
}: {
  row: AccountTableRow;
  columns: AccountColumn[];
  /** Whether a name sits clear of the chevrons on rows that open. */
  indent: boolean;
}) {
  const [open, setOpen] = useState(false);
  const lines = row.lines ?? [];
  const opens = lines.length > 0;
  return (
    <>
      <TableRow>
        <TableCell className="align-top text-muted-foreground tabular-nums">{row.number}</TableCell>
        <TableCell className="whitespace-normal">
          {opens ? (
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
              {row.name}
            </button>
          ) : (
            <span className={cn("flex items-center gap-1", indent && "pl-5")}>
              {row.name}
              <NoteInfo note={row.note} />
            </span>
          )}
        </TableCell>
        <Values columns={columns} values={row.values} />
      </TableRow>
      {open &&
        lines.map((line) => (
          <TableRow key={line.key} className="text-muted-foreground hover:bg-transparent">
            <TableCell />
            <TableCell className="pl-7 whitespace-normal">
              <div className="text-foreground">{line.name}</div>
              {line.detail && <div className="text-xs">{line.detail}</div>}
            </TableCell>
            <Values columns={columns} values={line.values} />
          </TableRow>
        ))}
    </>
  );
}

/**
 * Amounts by account, the way every financial table shows them: the account's number, then its name with any note
 * behind an info icon, then its values. An account with lines opens to them. Groups, such as
 * Revenue and Direct costs, each have a heading and may end in a total.
 */
export function AccountTable({
  label,
  nameHead,
  columns,
  groups,
}: {
  label: string;
  /** The name column's heading, such as Cost. Read only by a screen reader when left out. */
  nameHead?: string;
  columns: AccountColumn[];
  groups: AccountTableGroup[];
}) {
  const width = columns.length + 2;
  const indent = groups.some((g) => g.rows.some((r) => (r.lines?.length ?? 0) > 0));
  return (
    <Table aria-label={label}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Account</TableHead>
          <TableHead>{nameHead ?? <span className="sr-only">Name</span>}</TableHead>
          {columns.map((c) => (
            <TableHead key={c.head} className={cn(!c.text && "text-right")}>
              {c.head}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((group, i) => (
          <Fragment key={group.title ?? i}>
            {group.title && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={width} className={cn("font-medium", i > 0 && "pt-6")}>
                  {group.title}
                </TableCell>
              </TableRow>
            )}
            {group.rows.map((row) => (
              <AccountRows key={row.key} row={row} columns={columns} indent={indent} />
            ))}
            {group.footers?.map((f) => (
              <TableRow
                key={f.name}
                className={f.result ? "bg-muted/50 font-semibold hover:bg-muted/50" : "font-medium"}
              >
                <TableCell />
                <TableCell>{f.name}</TableCell>
                <Values columns={columns} values={f.values} />
              </TableRow>
            ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
