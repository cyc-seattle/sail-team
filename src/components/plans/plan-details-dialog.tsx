import { useState, type FormEvent, type ReactNode } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface PlanDetails {
  name: string;
  message: string | null;
}

export interface PlanDetailsDialogProps {
  /** What the button that opens it says. */
  trigger: ReactNode;
  title: string;
  /** A line under the title, when the dialog needs to say what will happen. */
  description?: string;
  initial: PlanDetails;
  /** False for a saved Financial Plan, whose name never changes. */
  nameEditable?: boolean;
  submitLabel: string;
  /** Rejects to keep the dialog open and show that it failed. */
  onSubmit: (details: PlanDetails) => Promise<void>;
}

/** A dialog that asks for a Financial Plan's name and note, to change them or to start a new draft with them. */
export function PlanDetailsDialog({
  trigger,
  title,
  description,
  initial,
  nameEditable = true,
  submitLabel,
  onSubmit,
}: PlanDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial.name);
  const [message, setMessage] = useState(initial.message ?? "");
  const [state, setState] = useState<"idle" | "saving" | "failed">("idle");

  const onOpenChange = (next: boolean) => {
    if (next) {
      setName(initial.name);
      setMessage(initial.message ?? "");
      setState("idle");
    }
    setOpen(next);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState("saving");
    try {
      await onSubmit({ name: name.trim(), message: message.trim() || null });
      setOpen(false);
      setState("idle");
    } catch {
      setState("failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="plan-name">Name</Label>
            <Input
              id="plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!nameEditable}
              required
            />
            {!nameEditable && <p className="text-xs text-muted-foreground">A saved plan keeps its name.</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="plan-note">Note</Label>
            <Textarea id="plan-note" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          {state === "failed" && (
            <p role="alert" className="text-sm text-destructive">
              That didn't work. Try again.
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={state === "saving" || !name.trim()}>
              {state === "saving" ? "Working…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
