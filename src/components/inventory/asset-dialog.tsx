import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "./form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { refusalOf } from "@/directus/financial-plans";
import {
  assetKinds,
  dollarsText,
  isBoat,
  parseDollars,
  type Asset,
  type AssetInput,
  type AssetKind,
  type BoatClass,
} from "@/model/inventory";

/** The longest note platform keeps. */
const NOTE_LENGTH = 280;

const text = (value: string) => value.trim() || null;

/**
 * A dialog that adds an asset, or changes one: what it is, its class and sail number when it's a boat, and its make,
 * numbers, value, and the day CSC got it. Closes on save; stays open, saying why, when Directus refuses.
 */
export function AssetDialog({
  open,
  onOpenChange,
  asset,
  classes,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The asset to change, or none to add one. */
  asset: Asset | null;
  classes: BoatClass[];
  onSave: (input: AssetInput) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        {/* Remounted on each open, so it starts from the asset as it is now. */}
        {open && <AssetForm asset={asset} classes={classes} onSave={onSave} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function AssetForm({
  asset,
  classes,
  onSave,
  onDone,
}: {
  asset: Asset | null;
  classes: BoatClass[];
  onSave: (input: AssetInput) => Promise<void>;
  onDone: () => void;
}) {
  const [kind, setKind] = useState<AssetKind>(asset?.kind ?? "sailboat");
  const [classId, setClassId] = useState(asset?.boat?.boat_class_id ?? "");
  const [sailNumber, setSailNumber] = useState(asset?.boat?.sail_number ?? "");
  const [name, setName] = useState(asset?.name ?? "");
  const [make, setMake] = useState(asset?.make ?? "");
  const [model, setModel] = useState(asset?.model ?? "");
  const [identifier, setIdentifier] = useState(asset?.identifier ?? "");
  const [registration, setRegistration] = useState(asset?.registration_number ?? "");
  const [value, setValue] = useState(dollarsText(asset?.value_cents ?? null));
  const [acquired, setAcquired] = useState(asset?.acquired_on ?? "");
  const [note, setNote] = useState(asset?.note ?? "");
  const [state, setState] = useState<{ kind: "idle" | "saving" } | { kind: "failed"; reason: string }>({
    kind: "idle",
  });
  const boat = isBoat(kind);
  const cents = parseDollars(value);
  const badValue = Number.isNaN(cents);
  const kindItems = assetKinds.map((k) => ({ value: k.kind, label: k.label }));
  const classItems = classes.map((c) => ({ value: c.id, label: c.name }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState({ kind: "saving" });
    try {
      await onSave({
        kind,
        name: text(name),
        make: text(make),
        // A boat's model is its class.
        model: boat ? null : text(model),
        identifier: text(identifier),
        registration_number: text(registration),
        value_cents: cents,
        acquired_on: acquired || null,
        note: text(note),
        boat: boat ? { boat_class_id: classId, sail_number: kind === "sailboat" ? text(sailNumber) : null } : null,
      });
      onDone();
    } catch (error) {
      setState({ kind: "failed", reason: refusalOf(error) });
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{asset ? "Edit asset" : "Add asset"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Kind">
          {(id) => (
            <Select items={kindItems} value={kind} onValueChange={(v) => setKind(v as AssetKind)}>
              <SelectTrigger id={id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {kindItems.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        {boat && (
          <FormField label="Boat class">
            {(id) => (
              <Select items={classItems} value={classId || null} onValueChange={(v) => setClassId(String(v ?? ""))}>
                <SelectTrigger id={id} className="w-full" aria-required>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classItems.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        )}
        <FormField label="Name">
          {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />}
        </FormField>
        {kind === "sailboat" && (
          <FormField label="Sail number">
            {(id) => <Input id={id} value={sailNumber} onChange={(e) => setSailNumber(e.target.value)} />}
          </FormField>
        )}
        <FormField label="Make">
          {(id) => <Input id={id} value={make} onChange={(e) => setMake(e.target.value)} />}
        </FormField>
        {!boat && (
          <FormField label="Model">
            {(id) => <Input id={id} value={model} onChange={(e) => setModel(e.target.value)} />}
          </FormField>
        )}
        <FormField label={boat ? "Hull number" : "Serial number"}>
          {(id) => <Input id={id} value={identifier} onChange={(e) => setIdentifier(e.target.value)} />}
        </FormField>
        <FormField label="Registration">
          {(id) => <Input id={id} value={registration} onChange={(e) => setRegistration(e.target.value)} />}
        </FormField>
        <FormField
          label="Value"
          hint={
            badValue && (
              <p role="alert" className="text-sm text-destructive">
                Enter dollars, such as 1250 or 1250.50.
              </p>
            )
          }
        >
          {(id) => (
            <Input
              id={id}
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={badValue || undefined}
            />
          )}
        </FormField>
        <FormField label="Acquired">
          {(id) => <Input id={id} type="date" value={acquired} onChange={(e) => setAcquired(e.target.value)} />}
        </FormField>
      </div>
      <FormField
        label="Note"
        hint={<p className="text-xs text-muted-foreground">{NOTE_LENGTH - note.length} characters left</p>}
      >
        {(id) => <Input id={id} value={note} maxLength={NOTE_LENGTH} onChange={(e) => setNote(e.target.value)} />}
      </FormField>
      {state.kind === "failed" && (
        <p role="alert" className="text-sm text-destructive">
          {state.reason}
        </p>
      )}
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={state.kind === "saving" || badValue || (boat && !classId)}>
          {state.kind === "saving" ? "Working…" : asset ? "Save" : "Add"}
        </Button>
      </DialogFooter>
    </form>
  );
}
