import { Link } from "@tanstack/react-router";
import { PencilIcon, PlusIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/form-field";
import { NoteInfo } from "@/components/plans/note-info";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { refusalOf } from "@/directus/financial-plans";
import type { StorageArea, StorageAreaInput, StorageGroup } from "@/model/inventory";

export interface StorageActions {
  canCreate: boolean;
  canUpdate: boolean;
  onCreate: (input: StorageAreaInput) => Promise<void>;
  onUpdate: (area: StorageArea, input: StorageAreaInput) => Promise<void>;
}

const pinned = "sticky left-0 z-10 bg-background";
const ft2 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const NOTE_LENGTH = 280;
const list = new Intl.ListFormat("en-US", { type: "conjunction" });

/** "Keelboat", "Keelboat and RIB", "420, Keelboat, and RIB". */
const listed = (names: string[]) => list.format(names);

/**
 * What CSC keeps in each storage area, areas by name: boats by class, with the area they take, then
 * other assets by kind. Each area shows the area its boats use against its own. What has no location comes last. A
 * Catalog Writer adds and edits areas here; an asset's location is set on the asset.
 */
export function StorageList({ groups, actions }: { groups: StorageGroup[]; actions: StorageActions }) {
  const [editing, setEditing] = useState<StorageArea | "new" | null>(null);
  const unmeasured = [...new Set(groups.flatMap((g) => g.unmeasured))];
  return (
    <section aria-label="Storage" className="grid gap-4">
      {actions.canCreate && (
        <div className="flex justify-end">
          <Button className="h-tap md:h-8" onClick={() => setEditing("new")}>
            <PlusIcon aria-hidden />
            Add storage area
          </Button>
        </div>
      )}
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No storage areas yet.</p>
      ) : (
        <Table aria-label="Storage" focusable>
          <TableHeader>
            <TableRow>
              <TableHead className={pinned}>Asset</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">Area (ft²)</TableHead>
              {actions.canUpdate && (
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          {groups.map((g) => (
            <TableBody key={g.area?.id ?? "none"}>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead scope="rowgroup" colSpan={2} className={pinned + " bg-transparent"}>
                  <span className="inline-flex items-center gap-1">
                    {g.area?.name ?? "No location"}
                    <NoteInfo note={g.area?.note} label={`Note on ${g.area?.name ?? ""}`} />
                  </span>
                </TableHead>
                <TableCell className="text-right font-medium tabular-nums whitespace-nowrap">
                  {g.area && g.area.area_sq_ft !== null
                    ? `${ft2.format(g.used_sq_ft)} of ${ft2.format(g.area.area_sq_ft)}`
                    : g.used_sq_ft > 0 && ft2.format(g.used_sq_ft)}
                </TableCell>
                {actions.canUpdate && (
                  <TableCell className="text-right">
                    {g.area && (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-tap md:size-8"
                              aria-label={`Edit ${g.area.name}`}
                              onClick={() => setEditing(g.area)}
                            />
                          }
                        >
                          <PencilIcon aria-hidden />
                        </TooltipTrigger>
                        <TooltipContent>Edit {g.area.name}</TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                )}
              </TableRow>
              {g.lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={actions.canUpdate ? 4 : 3} className="text-muted-foreground">
                    No assets yet.
                  </TableCell>
                </TableRow>
              ) : (
                g.lines.map((l) => (
                  <TableRow key={l.key}>
                    <TableCell className={pinned}>{l.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.count}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {l.sq_ft === null ? "—" : ft2.format(l.sq_ft)}
                    </TableCell>
                    {actions.canUpdate && <TableCell />}
                  </TableRow>
                ))
              )}
            </TableBody>
          ))}
        </Table>
      )}
      {unmeasured.length > 0 && (
        <Alert>
          <AlertDescription>
            {listed(unmeasured)} {unmeasured.length === 1 ? "has" : "have"} no area, so{" "}
            {unmeasured.length === 1 ? "it's" : "they're"} left out of the area used. Set it on{" "}
            <Link to="/inventory/classes" className="text-link underline">
              Boat classes
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}
      <StorageAreaDialog
        area={editing}
        onClose={() => setEditing(null)}
        onSave={(input) =>
          editing === "new" || editing === null ? actions.onCreate(input) : actions.onUpdate(editing, input)
        }
      />
    </section>
  );
}

function StorageAreaDialog({
  area,
  onClose,
  onSave,
}: {
  area: StorageArea | "new" | null;
  onClose: () => void;
  onSave: (input: StorageAreaInput) => Promise<void>;
}) {
  return (
    <Dialog open={area !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {area !== null && <StorageAreaForm area={area === "new" ? null : area} onSave={onSave} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function StorageAreaForm({
  area,
  onSave,
  onDone,
}: {
  area: StorageArea | null;
  onSave: (input: StorageAreaInput) => Promise<void>;
  onDone: () => void;
}) {
  const [name, setName] = useState(area?.name ?? "");
  const [size, setSize] = useState(String(area?.area_sq_ft ?? ""));
  const [note, setNote] = useState(area?.note ?? "");
  const [state, setState] = useState<{ kind: "idle" | "saving" } | { kind: "failed"; reason: string }>({
    kind: "idle",
  });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState({ kind: "saving" });
    try {
      await onSave({
        name: name.trim(),
        area_sq_ft: size.trim() === "" ? null : Number(size),
        note: note.trim() || null,
      });
      onDone();
    } catch (error) {
      setState({ kind: "failed", reason: refusalOf(error) });
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{area ? `Edit ${area.name}` : "Add storage area"}</DialogTitle>
      </DialogHeader>
      <FormField label="Name">
        {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} required />}
      </FormField>
      <FormField label="Area (ft²)">
        {(id) => (
          <Input id={id} type="number" min={0} step="any" value={size} onChange={(e) => setSize(e.target.value)} />
        )}
      </FormField>
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
        <Button type="submit" disabled={state.kind === "saving" || !name.trim()}>
          {state.kind === "saving" ? "Working…" : area ? "Save" : "Add storage area"}
        </Button>
      </DialogFooter>
    </form>
  );
}
