import { PencilIcon, PlusIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AccountCells, AccountHeads } from "@/components/account-cells";
import { FormField } from "@/components/form-field";
import { ReportSection } from "@/components/plans/reports/report-page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { refusalOf } from "@/directus/financial-plans";
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
 * storage one takes, and how many CSC has now. A Catalog Writer adds and edits classes here. Rates belong to each plan,
 * so they're on its Assumptions, not here.
 */
export function BoatClassList({
  classes,
  accounts,
  defaultAccountId,
  counts,
  actions,
}: {
  classes: BoatClass[];
  accounts: Account[];
  /** Where a class with no account of its own books its boats' upkeep. */
  defaultAccountId: string | null;
  /** Boats of each class CSC has now, by class id. */
  counts: Map<string, number>;
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
                <AccountHeads />
                <TableHead className="text-right">Capacity</TableHead>
                <TableHead className="text-right">Area (ft²)</TableHead>
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
                    <AccountCells account={account} />
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
        <FormField label="Capacity">
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
        <FormField label="Area (ft²)">
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
