import { Link } from "@tanstack/react-router";
import {
  ArchiveIcon,
  CircleDashedIcon,
  InfoIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SnowflakeIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react";
import { useId, useState, type FormEvent, type ReactElement } from "react";
import { InlineMarkdown } from "@/components/inline-markdown";
import { LabeledSwitch } from "@/components/labeled-switch";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { refusalOf } from "@/directus/financial-plans";
import { cn } from "@/lib/utils";
import { formatDate, formatDay } from "@/model/dates";
import { today, type ListedPlan } from "@/model/financial-plans";
import { Money } from "../money";
import { PageHeader } from "../page-header";

export interface PlanningActions {
  /**
   * Whether the person is a Plan Admin, who freezes a draft, changes the date a plan is active from, and archives it,
   * and whether they can delete a draft. Directus still checks each request.
   */
  canAdmin: boolean;
  canDelete: boolean;
  onFreeze: (plan: ListedPlan) => Promise<void>;
  /** Makes it active from `date`, `YYYY-MM-DD`, or not active at all. */
  onActivate: (plan: ListedPlan, date: string | null) => Promise<void>;
  onArchive: (plan: ListedPlan, archived: boolean) => Promise<void>;
  onDelete: (plan: ListedPlan) => Promise<void>;
}

/** The day that dates a plan: when it's active from, or else when it was frozen. Undated drafts are the newest. */
const dated = (plan: ListedPlan) => plan.in_force?.from ?? plan.frozen_at?.slice(0, 10) ?? "9999-12-31";
const newestFirst = (a: ListedPlan, b: ListedPlan) =>
  b.year - a.year || dated(b).localeCompare(dated(a)) || a.name.localeCompare(b.name);

/** An icon-only control's name, as its tooltip, on hover or focus. */
function Tip({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

const statuses: Record<"draft" | "frozen" | "archived", { icon: LucideIcon; label: string }> = {
  draft: { icon: CircleDashedIcon, label: "Draft" },
  frozen: { icon: SnowflakeIcon, label: "Frozen" },
  archived: { icon: ArchiveIcon, label: "Archived" },
};

/** Whether a plan is a draft, frozen, or archived, as an icon with its name in a tooltip. */
function StatusIcon({ plan }: { plan: ListedPlan }) {
  const { icon: Icon, label } = statuses[plan.archived ? "archived" : plan.status];
  const name = plan.archived ? `${label}, ${statuses[plan.status].label.toLowerCase()}` : label;
  return (
    <Tip label={name}>
      <span role="img" tabIndex={0} aria-label={name} className="inline-flex size-6 items-center justify-center">
        <Icon aria-hidden className="size-4 text-muted-foreground" />
      </span>
    </Tip>
  );
}

/** How many warnings platform's engine left on a plan, or an empty slot when none, so the icons line up. */
function Warnings({ count }: { count: number }) {
  if (count === 0) {
    return <span aria-hidden className="w-10" />;
  }
  const label = count === 1 ? "1 warning" : `${count} warnings`;
  return (
    <Tip label={label}>
      <span
        role="img"
        tabIndex={0}
        aria-label={label}
        className="inline-flex w-10 items-center gap-1 text-xs text-muted-foreground tabular-nums"
      >
        <TriangleAlertIcon aria-hidden className="size-4 text-warning" />
        {count}
      </span>
    </Tip>
  );
}

/** The day a plan is active from, the plan active now in bold. */
function ActiveDate({ plan }: { plan: ListedPlan }) {
  if (!plan.in_force) {
    return null;
  }
  return (
    <span
      className={cn("whitespace-nowrap tabular-nums", plan.in_force.when === "now" ? "font-semibold" : "font-normal")}
    >
      {formatDay(plan.in_force.from)}
    </span>
  );
}

/** The day a plan is active from, which a Plan Admin changes, or clears, from the table. */
function ActiveCell({ plan, actions }: { plan: ListedPlan; actions: PlanningActions }) {
  const current = plan.in_force?.from ?? null;
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(current ?? today());
  const [state, setState] = useState<{ kind: "idle" | "saving" } | { kind: "failed"; reason: string }>({
    kind: "idle",
  });
  const inputId = useId();
  const errorId = useId();
  if (!actions.canAdmin || plan.archived) {
    return <ActiveDate plan={plan} />;
  }
  const save = async (next: string | null) => {
    setState({ kind: "saving" });
    try {
      await actions.onActivate(plan, next);
      setOpen(false);
      setState({ kind: "idle" });
    } catch (error) {
      setState({ kind: "failed", reason: refusalOf(error) });
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save(date);
  };
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDate(current ?? today());
          setState({ kind: "idle" });
        }
        setOpen(next);
      }}
    >
      <Tip label={current ? "Change active date" : "Set active date"}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              className="-ml-2.5 h-tap md:h-8"
              aria-label={`Active date of ${plan.name}: ${current ? formatDay(current) : "none"}`}
            />
          }
        >
          <PencilIcon aria-hidden className="text-muted-foreground" />
          <ActiveDate plan={plan} />
        </PopoverTrigger>
      </Tip>
      <PopoverContent align="start" className="w-72" aria-label={`When ${plan.name} is active`}>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor={inputId}>Active from</Label>
            <Input
              id={inputId}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-describedby={state.kind === "failed" ? errorId : undefined}
              required
            />
            <p className="text-xs text-muted-foreground">
              From this date, it&apos;s the active plan for {plan.year}, until another plan&apos;s date.
            </p>
          </div>
          {state.kind === "failed" && (
            <p id={errorId} role="alert" className="text-sm text-destructive">
              {state.reason}
            </p>
          )}
          <div className="flex justify-end gap-2">
            {current && (
              <Button
                type="button"
                variant="outline"
                disabled={state.kind === "saving"}
                onClick={() => void save(null)}
              >
                Make inactive
              </Button>
            )}
            <Button type="submit" disabled={state.kind === "saving" || !date}>
              {state.kind === "saving" ? "Working…" : "Save"}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

type Action = "freeze" | "archive" | "unarchive" | "delete";
const labels: Record<Action, string> = {
  freeze: "Freeze",
  archive: "Archive",
  unarchive: "Unarchive",
  delete: "Delete",
};

/**
 * What can be done to a plan besides its date. A Plan Admin freezes a draft, archives a plan that isn't active and
 * won't be, and brings one back. A draft that's never been active can be deleted.
 */
function actionsFor(plan: ListedPlan, { canAdmin, canDelete }: PlanningActions): Action[] {
  if (plan.archived) {
    return canAdmin ? ["unarchive"] : [];
  }
  const freezable = canAdmin && plan.status === "draft";
  const archivable = canAdmin && (!plan.in_force || plan.in_force.when === "past");
  const deletable = canDelete && plan.status === "draft" && !plan.in_force;
  return [
    ...(freezable ? (["freeze"] as const) : []),
    ...(archivable ? (["archive"] as const) : []),
    ...(deletable ? (["delete"] as const) : []),
  ];
}

type Confirmed = "freeze" | "delete";

/** What freezing and deleting ask first, since neither can be undone. */
const confirmations = (plan: ListedPlan): Record<Confirmed, { title: string; description: string }> => ({
  freeze: {
    title: `Freeze ${plan.name}?`,
    description:
      "Once it's frozen, its plans and numbers never change, and it can't go back to a draft. Its name, note, and the date it's active from still can.",
  },
  delete: { title: `Delete ${plan.name}?`, description: "Its plans and numbers go with it. This can't be undone." },
});

/** A plan's actions, behind its ⋯ button. Freezing and deleting ask first; archiving can be undone, so it doesn't. */
function PlanMenu({ plan, actions }: { plan: ListedPlan; actions: PlanningActions }) {
  // The action stays set while its dialog closes, so the dialog keeps its words as it fades.
  const [pending, setPending] = useState<Confirmed>("freeze");
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<"idle" | "working" | "failed">("idle");
  const [archiveFailed, setArchiveFailed] = useState<string | null>(null);
  const items = actionsFor(plan, actions);
  if (items.length === 0) {
    return null;
  }
  const label = `More for ${plan.name}`;
  const confirm = async () => {
    setState("working");
    try {
      await (pending === "delete" ? actions.onDelete(plan) : actions.onFreeze(plan));
      setConfirming(false);
      setState("idle");
    } catch {
      setState("failed");
    }
  };
  return (
    <>
      {archiveFailed && (
        <span role="alert" className="mr-2 text-sm text-destructive">
          {archiveFailed}
        </span>
      )}
      <DropdownMenu>
        <Tip label={label}>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="size-tap md:size-8" aria-label={label} />}
          >
            <MoreHorizontalIcon aria-hidden />
          </DropdownMenuTrigger>
        </Tip>
        <DropdownMenuContent align="end">
          {items.map((item) => (
            <DropdownMenuItem
              key={item}
              variant={item === "delete" ? "destructive" : "default"}
              onClick={() => {
                if (item === "freeze" || item === "delete") {
                  setPending(item);
                  setConfirming(true);
                  return;
                }
                setArchiveFailed(null);
                actions.onArchive(plan, item === "archive").catch((error) => setArchiveFailed(refusalOf(error)));
              }}
            >
              {labels[item]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={confirming}
        onOpenChange={(next) => {
          setConfirming(next);
          setState("idle");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmations(plan)[pending].title}</DialogTitle>
            <DialogDescription>{confirmations(plan)[pending].description}</DialogDescription>
          </DialogHeader>
          {state === "failed" && (
            <p role="alert" className="text-sm text-destructive">
              That didn&apos;t work. Try again.
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant={pending === "delete" ? "destructive" : "default"}
              onClick={confirm}
              disabled={state === "working"}
            >
              {state === "working" ? "Working…" : labels[pending]}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** When and by whom a plan was frozen, what it started from, the release that calculated it, and its note, on hover or a tap. */
function PlanDetails({ plan }: { plan: ListedPlan }) {
  if (!plan.frozen_at && !plan.parent && !plan.platform && !plan.note) {
    return <span aria-hidden className="size-tap md:size-6" />;
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
          {plan.frozen_at
            ? `Frozen ${formatDate(plan.frozen_at)}${plan.frozen_by ? ` by ${plan.frozen_by}` : ""}`
            : null}
          {plan.frozen_at && plan.parent ? ". " : null}
          {plan.parent && (
            <>
              Started from{" "}
              <Link to="/plans/financial/$setId" params={{ setId: plan.parent.id }} className="text-link underline">
                {plan.parent.name}
              </Link>
            </>
          )}
        </p>
        {plan.platform && <p className="text-xs text-muted-foreground">Calculated with {plan.platform}</p>}
        {plan.note && (
          <p>
            <InlineMarkdown text={plan.note} />
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** An amount, or a dash while platform is still working it out. */
function Amount({ cents, colored = false }: { cents: number | null; colored?: boolean }) {
  return (
    <TableCell className="text-right">
      {cents === null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <Money cents={cents} colored={colored} whole />
      )}
    </TableCell>
  );
}

/**
 * Planning's first page: every Financial Plan in one table, under its year, newest first. One line a plan: its status,
 * details, and warnings as icons in fixed places, so they line up, and the date it's active from, which a Plan Admin
 * changes in place. Freezing, archiving, and deleting are in its ⋯ menu. Drafts show unless turned off, and
 * archived plans only when turned on.
 */
export function PlanningPage({ plans, actions }: { plans: ListedPlan[]; actions: PlanningActions }) {
  const [showDrafts, setShowDrafts] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const shown = plans
    .filter((p) => (showDrafts || p.status !== "draft") && (showArchived || !p.archived))
    .sort(newestFirst);
  const years = [...new Set(shown.map((p) => p.year))];
  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-card">
      <PageHeader title="Planning" />
      <div className="flex flex-wrap gap-x-6">
        <LabeledSwitch label="Show drafts" checked={showDrafts} onChange={setShowDrafts} />
        <LabeledSwitch label="Show archived" checked={showArchived} onChange={setShowArchived} />
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No plans match.</p>
      ) : (
        <Table aria-label="Financial Plans">
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          {years.map((year) => (
            <TableBody key={year}>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead scope="rowgroup" colSpan={7} className="tabular-nums">
                  {year}
                </TableHead>
              </TableRow>
              {shown
                .filter((p) => p.year === year)
                .map((p) => (
                  <TableRow key={p.id} className={cn(p.archived && "text-muted-foreground")}>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <StatusIcon plan={p} />
                        <PlanDetails plan={p} />
                        <Warnings count={p.warnings} />
                      </span>
                    </TableCell>
                    <TableCell>
                      <ActiveCell plan={p} actions={actions} />
                    </TableCell>
                    <TableCell>
                      <Link
                        to="/plans/financial/$setId"
                        params={{ setId: p.id }}
                        className="font-medium text-link underline"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <Amount cents={p.revenue_cents} />
                    <Amount cents={p.expense_cents} />
                    <Amount cents={p.net_cents} colored />
                    <TableCell className="text-right">
                      <PlanMenu plan={p} actions={actions} />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          ))}
        </Table>
      )}
    </main>
  );
}
