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
import { PlanDetailsDialog, type PlanDetails } from "./plan-details-dialog";

export interface FinancialPlanActionsProps {
  set: FinancialPlanSummary;
  /** Whether the person can change Financial Plans, and start them. Directus still checks each request. */
  canUpdate: boolean;
  canCreate: boolean;
  onEdit: (details: PlanDetails) => Promise<void>;
  onStart: (details: PlanDetails) => Promise<void>;
  onMove: (status: "saved" | "active") => Promise<void>;
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

/** A Financial Plan's buttons: edit its name and note, start a draft from it, and save it or mark it active. */
export function FinancialPlanActions({
  set,
  canUpdate,
  canCreate,
  onEdit,
  onStart,
  onMove,
}: FinancialPlanActionsProps) {
  return (
    <>
      {canUpdate && (
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
          trigger="Start a draft from this"
          title={`Start a draft from ${set.name}`}
          description={`The new draft starts as a copy of ${set.name}, for ${set.fiscal_year}. ${set.name} doesn't change.`}
          initial={{ name: `${set.name} copy`, message: null }}
          submitLabel="Start the draft"
          onSubmit={onStart}
        />
      )}
      {canUpdate && set.status === "draft" && (
        <ConfirmButton
          label="Save"
          title={`Save ${set.name}?`}
          description="Once it's saved, its plans and numbers never change. Its name and note still can."
          onConfirm={() => onMove("saved")}
        />
      )}
      {canUpdate && set.status === "saved" && (
        <ConfirmButton
          label="Mark active"
          title={`Mark ${set.name} active?`}
          description={`It becomes the plan the club runs for ${set.fiscal_year}, in place of the one active now.`}
          onConfirm={() => onMove("active")}
        />
      )}
    </>
  );
}
