import { Link } from "@tanstack/react-router";
import { PencilIcon, PlusIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/form-field";
import { RateTable } from "@/components/plans/assumptions";
import { Money } from "@/components/plans/money";
import { ReportSection } from "@/components/plans/reports/report-page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { refusalOf } from "@/directus/financial-plans";
import type { ActiveRates } from "@/directus/inventory";
import { sortClasses, type Account, type BoatClass, type BoatClassInput } from "@/model/inventory";

export interface BoatClassActions {
  canCreate: boolean;
  canUpdate: boolean;
  onCreate: (input: BoatClassInput) => Promise<void>;
  onUpdate: (boatClass: BoatClass, input: BoatClassInput) => Promise<void>;
}

const pinned = "sticky left-0 z-10 bg-background";
const DEFAULT_ACCOUNT = "default";

/**
 * Every boat class: the account its boats' fuel and upkeep are booked to, how many sailors one boat takes, the dry
 * storage one takes, and how many CSC has now. Under it, each class's rates in the active plan, read only. A Catalog
 * Writer adds and edits classes here.
 */
export function BoatClassList({
  classes,
  accounts,
  defaultAccountId,
  counts,
  rates,
  canReadRates,
  actions,
}: {
  classes: BoatClass[];
  accounts: Account[];
  /** Where a class with no account of its own books its boats' upkeep. */
  defaultAccountId: string | null;
  /** Boats of each class CSC has now, by class id. */
  counts: Map<string, number>;
  /** The active plan's rates, or null when no plan is active. */
  rates: ActiveRates | null;
  /** Whether the person can read plans' rates at all. */
  canReadRates: boolean;
  actions: BoatClassActions;
}) {
  const [editing, setEditing] = useState<BoatClass | "new" | null>(null);
  const sorted = sortClasses(classes);
  const accountOf = (c: BoatClass) => accounts.find((a) => a.id === (c.account_id ?? defaultAccountId));
  return (
    <>
      <ReportSection
        id="classes"
        title="Boat classes"
        actions={
          actions.canCreate && (
            <Button className="h-tap md:h-8" onClick={() => setEditing("new")}>
              <PlusIcon aria-hidden />
              Add boat class
            </Button>
          )
        }
      >
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No boat classes yet.</p>
        ) : (
          <Table aria-label="Boat classes">
            <TableHeader>
              <TableRow>
                <TableHead className={pinned}>Boat class</TableHead>
                <TableHead className="w-16">Account</TableHead>
                <TableHead>
                  <span className="sr-only">Account name</span>
                </TableHead>
                <TableHead className="text-right">Sailors per boat</TableHead>
                <TableHead className="text-right">Sq ft each</TableHead>
                <TableHead className="text-right">Boats</TableHead>
                {actions.canUpdate && (
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((c) => {
                const account = accountOf(c);
                return (
                  <TableRow key={c.id}>
                    <TableCell className={pinned + " font-medium"}>{c.name}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{account?.number}</TableCell>
                    <TableCell className="whitespace-nowrap">{account?.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.max_capacity}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.footprint_sq_ft ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{counts.get(c.id) ?? 0}</TableCell>
                    {actions.canUpdate && (
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-tap md:size-8"
                                aria-label={`Edit ${c.name}`}
                                onClick={() => setEditing(c)}
                              />
                            }
                          >
                            <PencilIcon aria-hidden />
                          </TooltipTrigger>
                          <TooltipContent>Edit {c.name}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ReportSection>
      {canReadRates && <BoatRates classes={sorted} rates={rates} />}
      <BoatClassDialog
        boatClass={editing}
        accounts={accounts}
        defaultAccount={accounts.find((a) => a.id === defaultAccountId) ?? null}
        onClose={() => setEditing(null)}
        onSave={(input) =>
          editing === "new" || editing === null ? actions.onCreate(input) : actions.onUpdate(editing, input)
        }
      />
    </>
  );
}

/** Each class's rates in the active plan, named and ordered as the plan's Assumptions show them. */
function BoatRates({ classes, rates }: { classes: BoatClass[]; rates: ActiveRates | null }) {
  if (!rates) {
    return (
      <ReportSection id="boat-rates" title="Boat rates">
        <p className="text-sm text-muted-foreground">No plan is active today.</p>
      </ReportSection>
    );
  }
  const priced = classes.filter((c) => rates.rates.has(c.id));
  const cents = (value: number | null | undefined, whole = false) =>
    value == null ? <span className="text-muted-foreground">—</span> : <Money cents={value} whole={whole} />;
  return (
    <ReportSection
      id="boat-rates"
      title="Boat rates"
      actions={
        <Link
          to="/plans/financial/$setId/$planId"
          params={{ setId: rates.plan.id, planId: "rates" }}
          className="text-sm text-link underline"
        >
          {rates.plan.name} assumptions
        </Link>
      }
    >
      {priced.length === 0 ? (
        <p className="text-sm text-muted-foreground">The active plan has no boat rates.</p>
      ) : (
        <RateTable label="Boat rates" head={["Boat class", "Fuel per hour", "Upkeep per hour", "Charter per day"]}>
          {priced.map((c) => {
            const rate = rates.rates.get(c.id)!;
            return (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell className="text-right">{cents(rate.fuel_per_hour_cents)}</TableCell>
                <TableCell className="text-right">{cents(rate.maintenance_per_boat_hour_cents)}</TableCell>
                <TableCell className="text-right">{cents(rate.charter_per_day_cents, true)}</TableCell>
              </TableRow>
            );
          })}
        </RateTable>
      )}
    </ReportSection>
  );
}

function BoatClassDialog({
  boatClass,
  accounts,
  defaultAccount,
  onClose,
  onSave,
}: {
  boatClass: BoatClass | "new" | null;
  accounts: Account[];
  defaultAccount: Account | null;
  onClose: () => void;
  onSave: (input: BoatClassInput) => Promise<void>;
}) {
  return (
    <Dialog open={boatClass !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {boatClass !== null && (
          <BoatClassForm
            boatClass={boatClass === "new" ? null : boatClass}
            accounts={accounts}
            defaultAccount={defaultAccount}
            onSave={onSave}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function BoatClassForm({
  boatClass,
  accounts,
  defaultAccount,
  onSave,
  onDone,
}: {
  boatClass: BoatClass | null;
  accounts: Account[];
  defaultAccount: Account | null;
  onSave: (input: BoatClassInput) => Promise<void>;
  onDone: () => void;
}) {
  const [name, setName] = useState(boatClass?.name ?? "");
  const [sailors, setSailors] = useState(String(boatClass?.max_capacity ?? ""));
  const [footprint, setFootprint] = useState(String(boatClass?.footprint_sq_ft ?? ""));
  const [account, setAccount] = useState(boatClass?.account_id ?? DEFAULT_ACCOUNT);
  const [state, setState] = useState<{ kind: "idle" | "saving" } | { kind: "failed"; reason: string }>({
    kind: "idle",
  });
  const accountItems = [
    {
      value: DEFAULT_ACCOUNT,
      label: defaultAccount ? `Default, ${defaultAccount.number} ${defaultAccount.name}` : "Default",
    },
    ...accounts.map((a) => ({ value: a.id, label: `${a.number} ${a.name}` })),
  ];
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState({ kind: "saving" });
    try {
      await onSave({
        name: name.trim(),
        max_capacity: Number(sailors),
        footprint_sq_ft: footprint.trim() === "" ? null : Number(footprint),
        account_id: account === DEFAULT_ACCOUNT ? null : account,
      });
      onDone();
    } catch (error) {
      setState({ kind: "failed", reason: refusalOf(error) });
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{boatClass ? `Edit ${boatClass.name}` : "Add boat class"}</DialogTitle>
      </DialogHeader>
      <FormField label="Name">
        {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} required />}
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Sailors per boat">
          {(id) => (
            <Input
              id={id}
              type="number"
              min={0}
              step={1}
              value={sailors}
              onChange={(e) => setSailors(e.target.value)}
              required
            />
          )}
        </FormField>
        <FormField label="Sq ft each">
          {(id) => (
            <Input
              id={id}
              type="number"
              min={0}
              step="any"
              value={footprint}
              onChange={(e) => setFootprint(e.target.value)}
            />
          )}
        </FormField>
      </div>
      <FormField label="Account">
        {(id) => (
          <Select items={accountItems} value={account} onValueChange={(v) => setAccount(String(v ?? DEFAULT_ACCOUNT))}>
            <SelectTrigger id={id} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accountItems.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>
      {state.kind === "failed" && (
        <p role="alert" className="text-sm text-destructive">
          {state.reason}
        </p>
      )}
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={state.kind === "saving" || !name.trim() || sailors === ""}>
          {state.kind === "saving" ? "Working…" : boatClass ? "Save" : "Add boat class"}
        </Button>
      </DialogFooter>
    </form>
  );
}
