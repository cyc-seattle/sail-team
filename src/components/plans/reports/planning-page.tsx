import { Link } from "@tanstack/react-router";
import { BotIcon, TriangleAlertIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  /** Whether the planning agent wrote it. */
  from_agent: boolean;
  warnings: number;
  revenue_cents: number;
  expense_cents: number;
  net_cents: number;
}

function PlanLink({ plan }: { plan: PlanSummary }) {
  return (
    <Link to="/plans/financial/$setId" params={{ setId: plan.id }} className="font-medium text-link underline">
      {plan.name}
    </Link>
  );
}

function Warnings({ plan }: { plan: PlanSummary }) {
  if (plan.warnings === 0) {
    return null;
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <TriangleAlertIcon aria-hidden className="size-4 text-warning" />
      {plan.warnings === 1 ? "1 warning" : `${plan.warnings} warnings`}
    </span>
  );
}

function TopLine({ plan }: { plan: PlanSummary }) {
  return (
    <dl className="grid grid-cols-3 gap-x-card text-sm sm:text-right">
      {(
        [
          ["Revenue", plan.revenue_cents, false],
          ["Expenses", plan.expense_cents, false],
          ["Net", plan.net_cents, true],
        ] as const
      ).map(([label, cents, colored]) => (
        <div key={label} className="grid">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd>
            <Money cents={cents} colored={colored} whole />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Deleting a draft takes its plans and numbers with it, so it asks first. */
function DeleteDraft({ plan }: { plan: PlanSummary }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" />}>Delete</DialogTrigger>
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
  );
}

/**
 * A draft: who wrote it, what it started from, its note, and its numbers. Keeping it means saving it, and the buttons to
 * compare, save or delete it sit on the right.
 */
function DraftCard({ plan }: { plan: PlanSummary }) {
  return (
    <article aria-label={plan.name} className="grid gap-3 rounded-lg bg-card p-card ring-1 ring-border">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <PlanLink plan={plan} />
            <VersionBadge state={plan.status} />
            {plan.from_agent && (
              <Badge variant="outline">
                <BotIcon aria-hidden />
                Planning agent
              </Badge>
            )}
          </span>
          {plan.parent && (
            <span className="text-xs text-muted-foreground">
              Started from{" "}
              <Link to="/plans/financial/$setId" params={{ setId: plan.parent.id }} className="text-link underline">
                {plan.parent.name}
              </Link>
            </span>
          )}
        </div>
        <TopLine plan={plan} />
      </div>
      {plan.note && <p className="max-w-3xl text-sm whitespace-pre-line">{plan.note}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Warnings plan={plan} />
        <div className="ml-auto flex flex-wrap gap-2">
          {plan.parent && (
            <Button
              variant="outline"
              render={
                <Link to="/plans/compare/$a/$b" params={{ a: plan.parent.id, b: plan.id }}>
                  Compare with {plan.parent.name}
                </Link>
              }
            />
          )}
          <Button>Save</Button>
          <DeleteDraft plan={plan} />
        </div>
      </div>
    </article>
  );
}

/**
 * Planning's first page: each year's active Financial Plan, its drafts, including any the planning agent wrote, and
 * the plans saved before, newest year first.
 */
export function PlanningPage({ plans }: { plans: PlanSummary[] }) {
  const years = [...new Set(plans.map((p) => p.year))].sort((a, b) => b - a);
  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-card">
      <PageHeader title="Planning" />
      <div className="grid gap-12">
        {years.map((year) => {
          const own = plans.filter((p) => p.year === year);
          const active = own.find((p) => p.status === "active");
          const drafts = own.filter((p) => p.status === "draft");
          const saved = own
            .filter((p) => p.status === "saved")
            .sort((a, b) => (b.saved_at ?? "").localeCompare(a.saved_at ?? ""));
          return (
            <section key={year} aria-labelledby={`year-${year}`} className="grid gap-6">
              <h2 id={`year-${year}`} className="text-xl font-semibold">
                {year}
              </h2>
              {active && (
                <article
                  aria-label={active.name}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-card p-card ring-1 ring-border"
                >
                  <div className="grid gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <PlanLink plan={active} />
                      <VersionBadge state="active" />
                    </span>
                    <span className="text-xs text-muted-foreground">Saved {formatDate(active.saved_at)}</span>
                    <Warnings plan={active} />
                  </div>
                  <TopLine plan={active} />
                </article>
              )}
              {drafts.length > 0 && (
                <section aria-labelledby={`drafts-${year}`} className="grid gap-3">
                  <h3 id={`drafts-${year}`} className="font-medium">
                    Drafts
                  </h3>
                  {drafts.map((d) => (
                    <DraftCard key={d.id} plan={d} />
                  ))}
                </section>
              )}
              {saved.length > 0 && (
                <section aria-labelledby={`saved-${year}`} className="grid gap-3">
                  <h3 id={`saved-${year}`} className="font-medium">
                    Saved before
                  </h3>
                  <Table aria-labelledby={`saved-${year}`}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan</TableHead>
                        <TableHead>Saved</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saved.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <PlanLink plan={p} />
                          </TableCell>
                          <TableCell className="tabular-nums">{formatDate(p.saved_at)}</TableCell>
                          <TableCell className="text-right">
                            <Money cents={p.net_cents} colored whole />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </section>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
