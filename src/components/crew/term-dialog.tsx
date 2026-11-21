import { useState } from "react";
import { FormField } from "@/components/form-field";
import { LabeledSwitch } from "@/components/labeled-switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CrewData, CrewTerm, TermInput } from "@/model/crew";
import { dollarsText, parseDollars } from "@/model/inventory";
import { SaveFailed } from "./row-menu";
import { runSave, type SaveState } from "./save";

const NONE = "none";

/** The longest note platform keeps. */
export const NOTE_LENGTH = 280;

const text = (value: string) => value.trim() || null;

/** A term's program or program area, as one choice: `program:<id>`, `area:<id>`, or none. */
const placeOf = (t: CrewTerm | null) =>
  t?.program_id ? `program:${t.program_id}` : t?.program_area_id ? `area:${t.program_area_id}` : NONE;

/**
 * A dialog that puts a crew member in a position, or changes one they hold: the position, the program or program area
 * it's in, if any, its first and last days, and, for a Crew Writer, its pay.
 */
export function TermDialog({
  open,
  onOpenChange,
  term,
  data,
  pay,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The term to change, or none to add one. */
  term: CrewTerm | null;
  data: Pick<CrewData, "positions" | "programs" | "areas" | "staffLevels">;
  /** Whether to show and send its pay. */
  pay: boolean;
  onSave: (input: TermInput) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        {open && <TermForm term={term} data={data} pay={pay} onSave={onSave} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function TermForm({
  term,
  data,
  pay,
  onSave,
  onDone,
}: {
  term: CrewTerm | null;
  data: Pick<CrewData, "positions" | "programs" | "areas" | "staffLevels">;
  pay: boolean;
  onSave: (input: TermInput) => Promise<void>;
  onDone: () => void;
}) {
  const [positionId, setPositionId] = useState(term?.position_id ?? "");
  const [place, setPlace] = useState(placeOf(term));
  const [startsOn, setStartsOn] = useState(term?.starts_on ?? "");
  const [endsOn, setEndsOn] = useState(term?.ends_on ?? "");
  const [note, setNote] = useState(term?.note ?? "");
  const [levelId, setLevelId] = useState(term?.staff_level_id ?? NONE);
  const [rate, setRate] = useState(dollarsText(term?.hourly_rate_cents ?? null));
  const [profitShare, setProfitShare] = useState(term?.profit_share ?? false);
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const cents = parseDollars(rate);
  const badRate = Number.isNaN(cents);
  const backwards = startsOn !== "" && endsOn !== "" && endsOn < startsOn;
  const positions = [...data.positions].sort((a, b) => a.name.localeCompare(b.name));
  const positionItems = positions.map((p) => ({ value: p.id, label: p.name }));
  const placeItems = [
    { value: NONE, label: "None" },
    ...data.areas.map((a) => ({ value: `area:${a.id}`, label: a.name })),
    ...data.programs.map((p) => ({ value: `program:${p.id}`, label: p.name })),
  ];
  // An archived staff level stays on the terms that have it, but isn't offered for others.
  const levels = data.staffLevels.filter((l) => !l.archived_at || l.id === term?.staff_level_id);
  const levelItems = [{ value: NONE, label: "None" }, ...levels.map((l) => ({ value: l.id, label: l.name }))];
  const [kind, placeId] = place.split(":");

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void runSave(
          () =>
            onSave({
              crew_member_id: term?.crew_member_id ?? "",
              position_id: positionId,
              program_id: kind === "program" ? placeId! : null,
              program_area_id: kind === "area" ? placeId! : null,
              starts_on: startsOn || null,
              ends_on: endsOn || null,
              note: text(note),
              ...(pay && {
                staff_level_id: levelId === NONE ? null : levelId,
                hourly_rate_cents: cents,
                profit_share: profitShare,
              }),
            }),
          setState,
          onDone,
        );
      }}
    >
      <DialogHeader>
        <DialogTitle>{term ? "Edit position held" : "Assign position"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Position">
          {(id) => (
            <Select
              items={positionItems}
              value={positionId || null}
              onValueChange={(v) => setPositionId(String(v ?? ""))}
            >
              <SelectTrigger id={id} className="w-full" aria-required>
                <SelectValue placeholder="Choose a position" />
              </SelectTrigger>
              <SelectContent>
                {positionItems.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField label="In">
          {(id) => (
            <Select items={placeItems} value={place} onValueChange={(v) => setPlace(String(v ?? NONE))}>
              <SelectTrigger id={id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                <SelectGroup>
                  <SelectLabel>Program areas</SelectLabel>
                  {data.areas.map((a) => (
                    <SelectItem key={a.id} value={`area:${a.id}`}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Programs</SelectLabel>
                  {data.programs.map((p) => (
                    <SelectItem key={p.id} value={`program:${p.id}`}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField label="From">
          {(id) => <Input id={id} type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />}
        </FormField>
        <FormField
          label="To"
          hint={
            backwards && (
              <p role="alert" className="text-sm text-destructive">
                The last day comes before the first.
              </p>
            )
          }
        >
          {(id) => (
            <Input
              id={id}
              type="date"
              value={endsOn}
              onChange={(e) => setEndsOn(e.target.value)}
              aria-invalid={backwards || undefined}
            />
          )}
        </FormField>
        {pay && (
          <>
            <FormField label="Staff level">
              {(id) => (
                <Select items={levelItems} value={levelId} onValueChange={(v) => setLevelId(String(v ?? NONE))}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levelItems.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
            <FormField
              label="Hourly rate"
              hint={
                badRate ? (
                  <p role="alert" className="text-sm text-destructive">
                    Enter dollars, such as 32 or 32.50.
                  </p>
                ) : null
              }
            >
              {(id) => (
                <Input
                  id={id}
                  inputMode="decimal"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  aria-invalid={badRate || undefined}
                />
              )}
            </FormField>
            <LabeledSwitch label="Profit share" checked={profitShare} onChange={setProfitShare} />
          </>
        )}
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
        <Button type="submit" disabled={state.kind === "saving" || !positionId || badRate || backwards}>
          {state.kind === "saving" ? "Working…" : term ? "Save" : "Assign position"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Asks the last day someone holds a position, today unless changed. */
export function EndTermDialog({
  title,
  day,
  open,
  onClose,
  onEnd,
}: {
  title: string;
  day: string;
  open: boolean;
  onClose: () => void;
  onEnd: (on: string) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>{open && <EndForm title={title} day={day} onEnd={onEnd} onDone={onClose} />}</DialogContent>
    </Dialog>
  );
}

function EndForm({
  title,
  day,
  onEnd,
  onDone,
}: {
  title: string;
  day: string;
  onEnd: (on: string) => Promise<void>;
  onDone: () => void;
}) {
  const [date, setDate] = useState(day);
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void runSave(() => onEnd(date), setState, onDone);
      }}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <FormField label="Last day">
        {(id) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />}
      </FormField>
      <SaveFailed state={state} />
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={state.kind === "saving" || !date}>
          {state.kind === "saving" ? "Working…" : "End position"}
        </Button>
      </DialogFooter>
    </form>
  );
}
