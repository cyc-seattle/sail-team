import { useState, type FormEvent } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { refusalOf } from "@/directus/financial-plans";
import { today } from "@/model/financial-plans";

export interface ActiveDateDialogProps {
  /** The plan's name and year, such as Budget and 2027. */
  name: string;
  year: number;
  /** The day it's active from now, or null for a plan that's never been made active. */
  current: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rejects to keep the dialog open and say why platform refused it. */
  onSubmit: (date: string) => Promise<void>;
}

/**
 * Asks the finance committee for the day a Financial Plan is in force from, today unless it has a date already. A
 * draft can be active, and stays a draft.
 */
export function ActiveDateDialog({ name, year, current, open, onOpenChange, onSubmit }: ActiveDateDialogProps) {
  const [date, setDate] = useState(current ?? today());
  const [state, setState] = useState<{ kind: "idle" | "saving" } | { kind: "failed"; reason: string }>({
    kind: "idle",
  });
  const changing = current !== null;

  const openChange = (next: boolean) => {
    if (next) {
      setDate(current ?? today());
      setState({ kind: "idle" });
    }
    onOpenChange(next);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState({ kind: "saving" });
    try {
      await onSubmit(date);
      onOpenChange(false);
      setState({ kind: "idle" });
    } catch (error) {
      setState({ kind: "failed", reason: refusalOf(error) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{changing ? `Change when ${name} is active` : `Make ${name} active`}</DialogTitle>
            <DialogDescription>
              From this date, it&apos;s the plan in force for {year}, until another plan&apos;s date. A draft stays a
              draft, and its plans can still change.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="active-from">Active from</Label>
            <Input id="active-from" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          {state.kind === "failed" && (
            <p role="alert" className="text-sm text-destructive">
              {state.reason}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={state.kind === "saving" || !date}>
              {state.kind === "saving" ? "Working…" : changing ? "Save" : "Make active"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
