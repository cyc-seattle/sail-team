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
import type { ListedPlan } from "@/model/financial-plans";
import { Money } from "../money";
import { PageHeader } from "../page-header";
import { VersionBadge, type VersionState } from "../version-badge";

export interface PlanningActions {
  /** Whether the person can save, mark active, and delete Financial Plans. Directus still checks each request. */
  canUpdate: boolean;
  canDelete: boolean;
  onMove: (plan: ListedPlan, status: "saved" | "active") => Promise<void>;
  onDelete: (plan: ListedPlan) => Promise<void>;
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
const byStatus = (a: ListedPlan, b: ListedPlan) =>
  statusOrder[a.status] - statusOrder[b.status] ||
  (a.status === "draft" ? a.name.localeCompare(b.name) : (b.saved_at ?? "").localeCompare(a.saved_at ?? ""));

type Action = "save" | "activate" | "delete";

/** What each action asks before it does what can't be undone. */
const confirmations = (plan: ListedPlan): Record<Action, { label: string; title: string; description: string }> => ({
  save: {
    label: "Save",
    title: `Save ${plan.name}?`,
    description: "Once it's saved, its plans and numbers never change. Its name and note still can.",
  },
  activate: {
    label: "Mark active",
    title: `Mark ${plan.name} active?`,
    description: `It becomes the plan the club runs for ${plan.year}, in place of the one active now.`,
  },
  delete: {
    label: "Delete",
    title: `Delete ${plan.name}?`,
    description: "Its plans and numbers go with it. This can't be undone.",
  },
});

/**
 * A plan's buttons in one menu: a draft is saved or deleted, and a saved one marked active. Each asks first, since none
 * can be undone.
 */
function PlanActions({ plan, actions }: { plan: ListedPlan; actions: PlanningActions }) {
  // The action stays set while its dialog closes, so the dialog keeps its words as it fades.
  const [pending, setPending] = useState<Action>("save");
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "working" | "failed">("idle");
  const items: Action[] =
    plan.status === "draft"
      ? [...(actions.canUpdate ? (["save"] as const) : []), ...(actions.canDelete ? (["delete"] as const) : [])]
      : plan.status === "saved" && actions.canUpdate
        ? ["activate"]
        : [];
  if (items.length === 0) {
    return null;
  }
  const asks = confirmations(plan);
  const confirm = async () => {
    setState("working");
    try {
      if (pending === "delete") {
        await actions.onDelete(plan);
      } else {
        await actions.onMove(plan, pending === "save" ? "saved" : "active");
      }
      setOpen(false);
      setState("idle");
    } catch {
      setState("failed");
    }
  };
  const ask = asks[pending];
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" aria-label={`Actions for ${plan.name}`} />}>
          Actions
          <ChevronDownIcon aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {items.map((item) => (
            <DropdownMenuItem
              key={item}
              variant={item === "delete" ? "destructive" : "default"}
              onClick={() => {
                setPending(item);
                setOpen(true);
              }}
            >
              {asks[item].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          setState("idle");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ask.title}</DialogTitle>
            <DialogDescription>{ask.description}</DialogDescription>
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
              {state === "working" ? "Working…" : ask.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** When a plan was saved, what it started from, and its note, such as the planning agent's report, on hover or a tap. */
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
          {plan.saved_at ? `Saved ${formatDate(plan.saved_at)}${plan.saved_by ? ` by ${plan.saved_by}` : ""}` : null}
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
 * Planning's first page: every Financial Plan in one table, narrowed by year and status, opening on the newest year.
 * One line a plan: its details on hover, and its actions in a menu, where a draft, such as one the planning agent
 * wrote, is saved or deleted.
 */
export function PlanningPage({ plans, actions }: { plans: ListedPlan[]; actions: PlanningActions }) {
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
                <Amount cents={p.revenue_cents} />
                <Amount cents={p.expense_cents} />
                <Amount cents={p.net_cents} colored />
                <TableCell className="text-right">
                  <PlanActions plan={p} actions={actions} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
