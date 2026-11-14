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
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FinancialPlanSummary } from "@/model/financial-plans";
import { ActiveDateDialog } from "./active-date-dialog";
import { PlanDetailsDialog, type PlanDetails } from "./plan-details-dialog";

export interface FinancialPlanActionsProps {
  set: FinancialPlanSummary;
  /**
   * Whether the person can rename it and change its note, start a draft from it, and, on the finance committee, freeze
   * it and make it active. Directus still checks each request.
   */
  canEdit: boolean;
  canCreate: boolean;
  canApprove: boolean;
  onEdit: (details: PlanDetails) => Promise<void>;
  onStart: (details: PlanDetails) => Promise<void>;
  onFreeze: () => Promise<void>;
  /** Makes it active from `date`, `YYYY-MM-DD`. */
  onActivate: (date: string) => Promise<void>;
}

/** The button that asks the finance committee for the day a plan is active from. */
function ActiveDateButton({ set, onActivate }: Pick<FinancialPlanActionsProps, "set" | "onActivate">) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} variant={set.effective_from ? "outline" : "default"}>
        {set.effective_from ? "Change active date" : "Make active"}
      </Button>
      <ActiveDateDialog
        name={set.name}
        year={set.fiscal_year}
        current={set.effective_from}
        open={open}
        onOpenChange={setOpen}
        onSubmit={onActivate}
      />
    </>
  );
}

/** A button that asks before it does something that can't be undone. */
function ConfirmButton({
  label,
  title,
  description,
  onConfirm,
}: {
  label: string;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "working" | "failed">("idle");
  const confirm = async () => {
    setState("working");
    try {
      await onConfirm();
      setOpen(false);
      setState("idle");
    } catch {
      setState("failed");
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>{label}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {state === "failed" && (
          <p role="alert" className="text-sm text-destructive">
            That didn't work. Try again.
          </p>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={confirm} disabled={state === "working"}>
            {state === "working" ? "Working…" : label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A Financial Plan's buttons: edit its name and note, duplicate it as a new draft, and, for the finance committee,
 * freeze it and make it active from a date.
 */
export function FinancialPlanActions({
  set,
  canEdit,
  canCreate,
  canApprove,
  onEdit,
  onStart,
  onFreeze,
  onActivate,
}: FinancialPlanActionsProps) {
  return (
    <>
      {canEdit && (
        <PlanDetailsDialog
          trigger="Edit"
          title={`Edit ${set.name}`}
          initial={set}
          submitLabel="Save"
          onSubmit={onEdit}
        />
      )}
      {canCreate && (
        <PlanDetailsDialog
          trigger="Duplicate"
          title={`Duplicate ${set.name}`}
          description={`The copy is a draft, for ${set.fiscal_year}. ${set.name} doesn't change.`}
          initial={{ name: `${set.name} copy`, message: null }}
          submitLabel="Duplicate"
          onSubmit={onStart}
        />
      )}
      {canApprove && <ActiveDateButton set={set} onActivate={onActivate} />}
      {canApprove && set.status === "draft" && (
        <ConfirmButton
          label="Freeze"
          title={`Freeze ${set.name}?`}
          description="Once it's frozen, its plans and numbers never change. Its name, note, and the date it's active from still can."
          onConfirm={onFreeze}
        />
      )}
    </>
  );
}
