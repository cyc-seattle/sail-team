import { Link } from "@tanstack/react-router";
import { ChevronDownIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/model/dates";
import { Money } from "../money";
import { PageHeader } from "../page-header";
import { VersionBadge, type VersionState } from "../version-badge";

/** A Financial Plan as the Planning page lists it. */
export interface PlanSummary {
  id: string;
  name: string;
  year: number;
  status: VersionState;
  saved_at: string | null;
  parent: { id: string; name: string } | null;
  /** Its note. For a draft from the planning agent, the agent's report on what it did and what's left. */
  note: string | null;
  warnings: number;
  revenue_cents: number;
  expense_cents: number;
  net_cents: number;
}

const ALL = "all";
const statusOrder: Record<VersionState, number> = { active: 0, draft: 1, saved: 2 };
const statusItems = [
  { value: ALL, label: "Every status" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "saved", label: "Saved" },
];

/** Active first, then drafts by name, then saved ones, newest first. */
const byStatus = (a: PlanSummary, b: PlanSummary) =>
  statusOrder[a.status] - statusOrder[b.status] ||
  (a.status === "draft" ? a.name.localeCompare(b.name) : (b.saved_at ?? "").localeCompare(a.saved_at ?? ""));

/**
 * A plan's buttons in one menu: a draft is saved or deleted, and a saved one marked active. Deleting asks first, since
 * the draft's plans and numbers go with it.
 */
function PlanActions({ plan }: { plan: PlanSummary }) {
  const [deleting, setDeleting] = useState(false);
  if (plan.status === "active") {
    return null;
  }
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" aria-label={`Actions for ${plan.name}`} />}>
          Actions
          <ChevronDownIcon aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {plan.status === "draft" ? (
            <>
              <DropdownMenuItem>Save</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeleting(true)}>
                Delete
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem>Mark active</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {plan.name}?</DialogTitle>
            <DialogDescription>Its plans and numbers go with it. This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <DialogClose render={<Button variant="destructive" />}>Delete</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** When a plan was saved, what it started from, and its note, such as the planning agent's report, on hover or a tap. */
function PlanDetails({ plan }: { plan: PlanSummary }) {
  if (!plan.saved_at && !plan.parent && !plan.note) {
    return null;
  }
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={100}
        aria-label={`About ${plan.name}`}
        className="inline-flex size-tap shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground md:size-6"
      >
        <InfoIcon aria-hidden className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="start" aria-label={`About ${plan.name}`} className="w-80">
        <p className="text-xs text-muted-foreground">
          {plan.saved_at ? `Saved ${formatDate(plan.saved_at)}` : null}
          {plan.saved_at && plan.parent ? ". " : null}
          {plan.parent && (
            <>
              Started from{" "}
              <Link to="/plans/financial/$setId" params={{ setId: plan.parent.id }} className="text-link underline">
                {plan.parent.name}
              </Link>
            </>
          )}
        </p>
        {plan.note && <p>{plan.note}</p>}
      </PopoverContent>
    </Popover>
  );
}

function FilterSelect({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select items={items} value={value} onValueChange={(v) => onChange(String(v ?? ALL))}>
      <SelectTrigger aria-label={label} className="w-full data-[size=default]:h-tap md:w-44 md:data-[size=default]:h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Planning's first page: every Financial Plan in one table, narrowed by year and status, opening on the newest year.
 * One line a plan: its details on hover, and its actions in a menu, where a draft, such as one the planning agent
 * wrote, is saved or deleted.
 */
export function PlanningPage({ plans }: { plans: PlanSummary[] }) {
  const years = [...new Set(plans.map((p) => p.year))].sort((a, b) => b - a);
  const [year, setYear] = useState(String(years[0] ?? ALL));
  const [status, setStatus] = useState(ALL);
  const shown = plans
    .filter((p) => (year === ALL || String(p.year) === year) && (status === ALL || p.status === status))
    .sort((a, b) => b.year - a.year || byStatus(a, b));
  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-card">
      <PageHeader title="Planning" />
      <div className="flex flex-col gap-2 md:flex-row">
        <FilterSelect
          label="Year"
          value={year}
          onChange={setYear}
          items={[{ value: ALL, label: "Every year" }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
        />
        <FilterSelect label="Status" value={status} onChange={setStatus} items={statusItems} />
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No plans match.</p>
      ) : (
        <Table aria-label="Financial Plans">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-background">Plan</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="sticky left-0 z-10 bg-background">
                  <span className="flex items-center gap-1">
                    <Link
                      to="/plans/financial/$setId"
                      params={{ setId: p.id }}
                      className="font-medium text-link underline"
                    >
                      {p.name}
                    </Link>
                    <PlanDetails plan={p} />
                    {p.warnings > 0 && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <TriangleAlertIcon aria-hidden className="size-4 text-warning" />
                        <span className="sr-only">Warnings:</span>
                        {p.warnings}
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">{p.year}</TableCell>
                <TableCell>
                  <VersionBadge state={p.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Money cents={p.revenue_cents} whole />
                </TableCell>
                <TableCell className="text-right">
                  <Money cents={p.expense_cents} whole />
                </TableCell>
                <TableCell className="text-right">
                  <Money cents={p.net_cents} colored whole />
                </TableCell>
                <TableCell className="text-right">
                  <PlanActions plan={p} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
