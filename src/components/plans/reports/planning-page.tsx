import { Link } from "@tanstack/react-router";
import { InfoIcon, MoreHorizontalIcon, PencilIcon, TriangleAlertIcon } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { InlineMarkdown } from "@/components/markdown";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { refusalOf } from "@/directus/financial-plans";
import { cn } from "@/lib/utils";
import { formatDate } from "@/model/dates";
import { inForceText, today, type ListedPlan } from "@/model/financial-plans";
import { Money } from "../money";
import { PageHeader } from "../page-header";
import { VersionBadge } from "../version-badge";

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

const statusItems = [
  { value: "draft", label: "Draft" },
  { value: "saved", label: "Frozen" },
];

/** The day that dates a plan: when it's active from, or else when it was saved. Undated drafts are the newest. */
const dated = (plan: ListedPlan) => plan.in_force?.from ?? plan.saved_at?.slice(0, 10) ?? "9999-12-31";
const newestFirst = (a: ListedPlan, b: ListedPlan) =>
  b.year - a.year || dated(b).localeCompare(dated(a)) || a.name.localeCompare(b.name);

/** A draft's status, which a Plan Admin changes to frozen from the table, once it's confirmed. Freezing is for good. */
function StatusCell({ plan, actions }: { plan: ListedPlan; actions: PlanningActions }) {
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<"idle" | "working" | "failed">("idle");
  if (!actions.canAdmin || plan.archived || plan.status !== "draft") {
    return <VersionBadge state={plan.status} />;
  }
  const freeze = async () => {
    setState("working");
    try {
      await actions.onFreeze(plan);
      setConfirming(false);
      setState("idle");
    } catch {
      setState("failed");
    }
  };
  return (
    <>
      <Select
        items={statusItems}
        value={plan.status}
        onValueChange={(value) => {
          if (String(value) === "saved") {
            setConfirming(true);
          }
        }}
      >
        <SelectTrigger
          aria-label={`Status of ${plan.name}`}
          className="w-28 data-[size=default]:h-tap md:data-[size=default]:h-8"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Dialog
        open={confirming}
        onOpenChange={(next) => {
          setConfirming(next);
          setState("idle");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Freeze {plan.name}?</DialogTitle>
            <DialogDescription>
              Once it&apos;s frozen, its plans and numbers never change, and it can&apos;t go back to a draft. Its name,
              note, and the date it&apos;s active from still can.
            </DialogDescription>
          </DialogHeader>
          {state === "failed" && (
            <p role="alert" className="text-sm text-destructive">
              That didn&apos;t work. Try again.
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={freeze} disabled={state === "working"}>
              {state === "working" ? "Working…" : "Freeze"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** When a plan is active, the plan active now in bold. */
function ActiveText({ plan }: { plan: ListedPlan }) {
  if (!plan.in_force) {
    return <span className="text-muted-foreground">Not active</span>;
  }
  return (
    <span className={cn("whitespace-nowrap", plan.in_force.when === "now" ? "font-medium" : "text-muted-foreground")}>
      {inForceText(plan.in_force)}
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
    return <ActiveText plan={plan} />;
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
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            className="-ml-2.5 h-tap md:h-8"
            aria-label={`Active date of ${plan.name}: ${plan.in_force ? inForceText(plan.in_force) : "not active"}`}
          />
        }
      >
        <ActiveText plan={plan} />
        <PencilIcon aria-hidden className="text-muted-foreground" />
      </PopoverTrigger>
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

type Action = "archive" | "unarchive" | "delete";
const labels: Record<Action, string> = { archive: "Archive", unarchive: "Unarchive", delete: "Delete" };

/**
 * What else can be done to a plan. A Plan Admin archives one that isn't active and won't be, and brings one back. A
 * draft that's never been active can be deleted.
 */
function actionsFor(plan: ListedPlan, { canAdmin, canDelete }: PlanningActions): Action[] {
  if (plan.archived) {
    return canAdmin ? ["unarchive"] : [];
  }
  const archivable = canAdmin && (!plan.in_force || plan.in_force.when === "past");
  const deletable = canDelete && plan.status === "draft" && !plan.in_force;
  return [...(archivable ? (["archive"] as const) : []), ...(deletable ? (["delete"] as const) : [])];
}

/** A plan's other actions, behind its ⋯ button. Deleting asks first; archiving can be undone, so it doesn't. */
function PlanMenu({ plan, actions }: { plan: ListedPlan; actions: PlanningActions }) {
  const [deleting, setDeleting] = useState(false);
  const [state, setState] = useState<"idle" | "working" | "failed">("idle");
  const [archiveFailed, setArchiveFailed] = useState<string | null>(null);
  const items = actionsFor(plan, actions);
  if (items.length === 0) {
    return null;
  }
  const label = `More for ${plan.name}`;
  const confirmDelete = async () => {
    setState("working");
    try {
      await actions.onDelete(plan);
      setDeleting(false);
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
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" className="size-tap md:size-8" aria-label={label} />}
              />
            }
          >
            <MoreHorizontalIcon aria-hidden />
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          {items.map((item) => (
            <DropdownMenuItem
              key={item}
              variant={item === "delete" ? "destructive" : "default"}
              onClick={() => {
                if (item === "delete") {
                  setDeleting(true);
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
        open={deleting}
        onOpenChange={(next) => {
          setDeleting(next);
          setState("idle");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {plan.name}?</DialogTitle>
            <DialogDescription>Its plans and numbers go with it. This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          {state === "failed" && (
            <p role="alert" className="text-sm text-destructive">
              That didn&apos;t work. Try again.
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={confirmDelete} disabled={state === "working"}>
              {state === "working" ? "Working…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** When and by whom a plan was frozen, what it started from, the platform version that worked it out, and its note, on hover or a tap. */
function PlanDetails({ plan }: { plan: ListedPlan }) {
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
          {plan.saved_at ? `Frozen ${formatDate(plan.saved_at)}${plan.saved_by ? ` by ${plan.saved_by}` : ""}` : null}
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
        {plan.platform && <p className="text-xs text-muted-foreground">Platform {plan.platform}</p>}
        {plan.note && (
          <p>
            <InlineMarkdown>{plan.note}</InlineMarkdown>
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  const id = useId();
  return (
    <span className="flex min-h-tap items-center gap-2 md:min-h-8">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id}>{label}</Label>
    </span>
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
 * Planning's first page: every Financial Plan in one table, newest first. One line a plan: its details and note on
 * hover, and its status and active date, which a Plan Admin changes in place. Drafts show unless turned off, and
 * archived plans only when turned on.
 */
export function PlanningPage({ plans, actions }: { plans: ListedPlan[]; actions: PlanningActions }) {
  const [showDrafts, setShowDrafts] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const shown = plans
    .filter((p) => (showDrafts || p.status !== "draft") && (showArchived || !p.archived))
    .sort(newestFirst);
  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-card">
      <PageHeader title="Planning" />
      <div className="flex flex-wrap gap-x-6">
        <Toggle label="Show drafts" checked={showDrafts} onChange={setShowDrafts} />
        <Toggle label="Show archived" checked={showArchived} onChange={setShowArchived} />
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No plans match.</p>
      ) : (
        <Table aria-label="Financial Plans">
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead>
                <span className="sr-only">More</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((p) => (
              <TableRow key={p.id} className={cn(p.archived && "text-muted-foreground")}>
                <TableCell className="tabular-nums">{p.year}</TableCell>
                <TableCell>
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
                <TableCell>
                  <StatusCell plan={p} actions={actions} />
                </TableCell>
                <TableCell>
                  <ActiveCell plan={p} actions={actions} />
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
        </Table>
      )}
    </main>
  );
}
