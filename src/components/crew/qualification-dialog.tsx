import { useState } from "react";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CatalogQualification, HeldQualification, HeldQualificationInput } from "@/model/crew";
import { SaveFailed } from "./row-menu";
import { runSave, type SaveState } from "./save";
import { NOTE_LENGTH } from "./term-dialog";

/**
 * A dialog that records a qualification a crew member earned, or changes one: which, the day they earned it, the day it
 * expires, if it does, and a note such as a certificate number. A renewal is a new one, so the old one stays.
 */
export function QualificationDialog({
  open,
  onOpenChange,
  held,
  qualifications,
  day,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The one to change, or none to add one. */
  held: HeldQualification | null;
  qualifications: CatalogQualification[];
  /** Today, `YYYY-MM-DD`, the day a new one is earned unless changed. */
  day: string;
  onSave: (input: Omit<HeldQualificationInput, "crew_member_id">) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <QualificationForm
            held={held}
            qualifications={qualifications}
            day={day}
            onSave={onSave}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function QualificationForm({
  held,
  qualifications,
  day,
  onSave,
  onDone,
}: {
  held: HeldQualification | null;
  qualifications: CatalogQualification[];
  day: string;
  onSave: (input: Omit<HeldQualificationInput, "crew_member_id">) => Promise<void>;
  onDone: () => void;
}) {
  const [qualificationId, setQualificationId] = useState(held?.qualification_id ?? "");
  const [earnedOn, setEarnedOn] = useState(held?.earned_on ?? day);
  const [expiresOn, setExpiresOn] = useState(held?.expires_on ?? "");
  const [note, setNote] = useState(held?.note ?? "");
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const backwards = expiresOn !== "" && expiresOn < earnedOn;
  const items = qualifications.map((q) => ({ value: q.id, label: q.name }));
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void runSave(
          () =>
            onSave({
              qualification_id: qualificationId,
              earned_on: earnedOn,
              expires_on: expiresOn || null,
              note: note.trim() || null,
            }),
          setState,
          onDone,
        );
      }}
    >
      <DialogHeader>
        <DialogTitle>{held ? "Edit qualification" : "Add qualification"}</DialogTitle>
      </DialogHeader>
      <FormField label="Qualification">
        {(id) => (
          <Select
            items={items}
            value={qualificationId || null}
            onValueChange={(v) => setQualificationId(String(v ?? ""))}
          >
            <SelectTrigger id={id} className="w-full" aria-required>
              <SelectValue placeholder="Choose a qualification" />
            </SelectTrigger>
            <SelectContent>
              {items.map((q) => (
                <SelectItem key={q.value} value={q.value}>
                  {q.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Earned">
          {(id) => (
            <Input id={id} type="date" value={earnedOn} onChange={(e) => setEarnedOn(e.target.value)} required />
          )}
        </FormField>
        <FormField
          label="Expires"
          hint={
            backwards ? (
              <p role="alert" className="text-sm text-destructive">
                It expires before it was earned.
              </p>
            ) : null
          }
        >
          {(id) => (
            <Input
              id={id}
              type="date"
              value={expiresOn}
              onChange={(e) => setExpiresOn(e.target.value)}
              aria-invalid={backwards || undefined}
            />
          )}
        </FormField>
      </div>
      <FormField
        label="Note"
        hint={<p className="text-xs text-muted-foreground">{NOTE_LENGTH - note.length} characters left</p>}
      >
        {(id) => <Input id={id} value={note} maxLength={NOTE_LENGTH} onChange={(e) => setNote(e.target.value)} />}
      </FormField>
      <SaveFailed state={state} />
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={state.kind === "saving" || !qualificationId || !earnedOn || backwards}>
          {state.kind === "saving" ? "Working…" : held ? "Save" : "Add qualification"}
        </Button>
      </DialogFooter>
    </form>
  );
}
