import { useId, useState } from "react";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogQualification, CrewPosition, PositionInput } from "@/model/crew";
import { SaveFailed } from "./row-menu";
import { runSave, type SaveState } from "./save";

/**
 * A dialog that adds a position, or changes one: its name, what it does and how it's filled, and the qualifications
 * it needs.
 */
export function PositionDialog({
  open,
  onOpenChange,
  position,
  qualifications,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The position to change, or none to add one. */
  position: CrewPosition | null;
  qualifications: CatalogQualification[];
  onSave: (input: PositionInput) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        {open && (
          <PositionForm
            position={position}
            qualifications={qualifications}
            onSave={onSave}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PositionForm({
  position,
  qualifications,
  onSave,
  onDone,
}: {
  position: CrewPosition | null;
  qualifications: CatalogQualification[];
  onSave: (input: PositionInput) => Promise<void>;
  onDone: () => void;
}) {
  const [name, setName] = useState(position?.name ?? "");
  const [description, setDescription] = useState(position?.description ?? "");
  const [needs, setNeeds] = useState(position?.qualification_ids ?? []);
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const needsLabel = useId();
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void runSave(
          () =>
            onSave({
              name: name.trim(),
              description: description.trim() || null,
              // In the catalog's order, so the list reads the same each time.
              qualification_ids: qualifications.filter((q) => needs.includes(q.id)).map((q) => q.id),
            }),
          setState,
          onDone,
        );
      }}
    >
      <DialogHeader>
        <DialogTitle>{position ? "Edit position" : "Add position"}</DialogTitle>
      </DialogHeader>
      <FormField label="Name">
        {(id) => (
          <Input
            id={id}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Such as Treasurer"
            required
          />
        )}
      </FormField>
      <FormField label="Description">
        {(id) => <Textarea id={id} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />}
      </FormField>
      <div role="group" aria-labelledby={needsLabel} className="grid gap-2">
        <span id={needsLabel} className="text-sm font-medium">
          Needs
        </span>
        {qualifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">The catalog has no qualifications yet.</p>
        ) : (
          <div className="grid gap-1 sm:grid-cols-2">
            {qualifications.map((q) => (
              <Label key={q.id} className="flex min-h-tap items-center gap-2 font-normal md:min-h-8">
                <Checkbox
                  checked={needs.includes(q.id)}
                  onCheckedChange={(on) => setNeeds(on ? [...needs, q.id] : needs.filter((id) => id !== q.id))}
                />
                {q.name}
              </Label>
            ))}
          </div>
        )}
      </div>
      <SaveFailed state={state} />
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={state.kind === "saving" || !name.trim()}>
          {state.kind === "saving" ? "Working…" : position ? "Save" : "Add position"}
        </Button>
      </DialogFooter>
    </form>
  );
}
