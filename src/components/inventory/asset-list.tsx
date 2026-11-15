import { MoreHorizontalIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { LabeledSwitch } from "@/components/labeled-switch";
import { NoteInfo } from "@/components/plans/note-info";
import { Money } from "@/components/plans/money";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { refusalOf } from "@/directus/financial-plans";
import { cn } from "@/lib/utils";
import { formatDay } from "@/model/dates";
import {
  assetKinds,
  assetName,
  inService,
  sortAssets,
  sortClasses,
  type Asset,
  type AssetInput,
  type BoatClass,
  type StorageArea,
} from "@/model/inventory";
import { AssetDialog } from "./asset-dialog";

export interface AssetActions {
  /** What the person may do, from `/permissions/me`. Directus still checks each request. */
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onCreate: (input: AssetInput) => Promise<void>;
  onUpdate: (asset: Asset, input: AssetInput) => Promise<void>;
  /** Records the day it went, or clears it, `null`, to bring it back. */
  onDispose: (asset: Asset, on: string | null) => Promise<void>;
  onDelete: (asset: Asset) => Promise<void>;
}

const ALL = "all";
const pinned = "sticky left-0 z-10 bg-background";

function Filter({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select items={items} value={value} onValueChange={(v) => onChange(String(v ?? ALL))}>
      <SelectTrigger aria-label={label} className="w-full data-[size=default]:h-tap md:w-44 md:data-[size=default]:h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Whether `asset` has `q` in its name, sail number, make, model, or numbers. */
function found(asset: Asset, classes: BoatClass[], q: string): boolean {
  const words = [
    assetName(asset, classes),
    asset.boat?.sail_number,
    asset.make,
    asset.model,
    asset.identifier,
    asset.registration_number,
  ];
  return words.some((w) => w?.toLowerCase().includes(q));
}

type Pending = { kind: "edit" | "dispose" | "delete"; asset: Asset } | { kind: "add" };

/**
 * Every boat, motor, and piece of equipment CSC owns, by kind, with each kind's value and the total. Filter by kind and
 * class, or find one by name or number. What CSC no longer has shows only when turned on. A Catalog Writer adds and
 * edits assets here, records when one went, and deletes one entered by mistake.
 */
export function AssetList({
  assets,
  classes,
  areas,
  day,
  actions,
}: {
  assets: Asset[];
  classes: BoatClass[];
  /** Where assets are kept. */
  areas: StorageArea[];
  /** Today, `YYYY-MM-DD`, to tell what CSC still has. */
  day: string;
  actions: AssetActions;
}) {
  const [kind, setKind] = useState(ALL);
  const [classId, setClassId] = useState(ALL);
  const [q, setQ] = useState("");
  const [showDisposed, setShowDisposed] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const sortedClasses = sortClasses(classes);
  const needle = q.trim().toLowerCase();
  const shown = sortAssets(assets, classes).filter(
    (a) =>
      (kind === ALL || a.kind === kind) &&
      (classId === ALL || a.boat?.boat_class_id === classId) &&
      (showDisposed || a.disposed_on === null || a.disposed_on > day) &&
      (!needle || found(a, classes, needle)),
  );
  const total = shown.reduce((sum, a) => sum + (a.value_cents ?? 0), 0);
  const close = () => setPending(null);
  const columns = showDisposed ? 11 : 10;

  return (
    <section aria-label="Assets" className="grid gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <InputGroup className="h-tap md:h-8 md:max-w-xs">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Find by name or number"
            aria-label="Find by name or number"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </InputGroup>
        <Filter
          label="Kind"
          items={[{ value: ALL, label: "All kinds" }, ...assetKinds.map((k) => ({ value: k.kind, label: k.plural }))]}
          value={kind}
          onChange={setKind}
        />
        <Filter
          label="Boat class"
          items={[{ value: ALL, label: "All classes" }, ...sortedClasses.map((c) => ({ value: c.id, label: c.name }))]}
          value={classId}
          onChange={setClassId}
        />
        <LabeledSwitch label="Show disposed" checked={showDisposed} onChange={setShowDisposed} />
        {actions.canCreate && (
          <Button className="h-tap md:ml-auto md:h-8" onClick={() => setPending({ kind: "add" })}>
            <PlusIcon aria-hidden />
            Add asset
          </Button>
        )}
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">{assets.length === 0 ? "No assets yet." : "No assets match."}</p>
      ) : (
        <Table aria-label="Assets">
          <TableHeader>
            <TableRow>
              <TableHead className={pinned}>Name</TableHead>
              <TableHead>Boat class</TableHead>
              <TableHead>Sail no.</TableHead>
              <TableHead>Make</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Serial no.</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Acquired</TableHead>
              {showDisposed && <TableHead>Disposed</TableHead>}
              <TableHead className="text-right">Value</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          {assetKinds
            .filter((k) => shown.some((a) => a.kind === k.kind))
            .map((k) => {
              const rows = shown.filter((a) => a.kind === k.kind);
              return (
                <TableBody key={k.kind}>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead scope="rowgroup" colSpan={columns - 2} className={pinned + " bg-transparent"}>
                      {k.plural} <span className="font-normal text-muted-foreground tabular-nums">{rows.length}</span>
                    </TableHead>
                    <TableCell className="text-right font-medium">
                      <Money cents={rows.reduce((sum, a) => sum + (a.value_cents ?? 0), 0)} whole />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  {rows.map((a) => (
                    <AssetRow
                      key={a.id}
                      asset={a}
                      classes={classes}
                      areas={areas}
                      day={day}
                      showDisposed={showDisposed}
                      actions={actions}
                      onPick={(kind) => setPending({ kind, asset: a })}
                    />
                  ))}
                </TableBody>
              );
            })}
          <TableFooter className="bg-transparent">
            <TableRow>
              <TableCell colSpan={columns - 2} className={pinned}>
                Total
              </TableCell>
              <TableCell className="text-right">
                <Money cents={total} whole />
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      )}
      <AssetDialog
        open={pending?.kind === "add" || pending?.kind === "edit"}
        onOpenChange={(open) => !open && close()}
        asset={pending && pending.kind !== "add" ? pending.asset : null}
        classes={sortedClasses}
        areas={areas}
        onSave={(input) =>
          pending?.kind === "edit" ? actions.onUpdate(pending.asset, input) : actions.onCreate(input)
        }
      />
      <DisposeDialog
        asset={pending?.kind === "dispose" ? pending.asset : null}
        name={pending && pending.kind !== "add" ? assetName(pending.asset, classes) : ""}
        day={day}
        onClose={close}
        onDispose={actions.onDispose}
      />
      <DeleteDialog
        asset={pending?.kind === "delete" ? pending.asset : null}
        name={pending && pending.kind !== "add" ? assetName(pending.asset, classes) : ""}
        onClose={close}
        onDelete={actions.onDelete}
      />
    </section>
  );
}

function AssetRow({
  asset,
  classes,
  areas,
  day,
  showDisposed,
  actions,
  onPick,
}: {
  asset: Asset;
  classes: BoatClass[];
  areas: StorageArea[];
  day: string;
  showDisposed: boolean;
  actions: AssetActions;
  onPick: (kind: "edit" | "dispose" | "delete") => void;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const name = assetName(asset, classes);
  const gone = !inService(asset, day) && asset.disposed_on !== null;
  const items: { key: "edit" | "dispose" | "return" | "delete"; label: string }[] = [
    ...(actions.canUpdate ? [{ key: "edit" as const, label: "Edit" }] : []),
    ...(actions.canUpdate
      ? gone
        ? [{ key: "return" as const, label: "Bring back" }]
        : [{ key: "dispose" as const, label: "Dispose of" }]
      : []),
    ...(actions.canDelete ? [{ key: "delete" as const, label: "Delete" }] : []),
  ];
  const label = `More for ${name}`;
  return (
    <TableRow className={cn(gone && "text-muted-foreground")}>
      <TableCell className={cn(pinned, "font-medium")}>
        <span className="inline-flex items-center gap-1">
          {name}
          <NoteInfo note={asset.note} label={`Note on ${name}`} />
        </span>
      </TableCell>
      <TableCell>{classes.find((c) => c.id === asset.boat?.boat_class_id)?.name}</TableCell>
      <TableCell className="tabular-nums">{asset.boat?.sail_number}</TableCell>
      <TableCell>{asset.make}</TableCell>
      <TableCell>{asset.model}</TableCell>
      <TableCell className="tabular-nums">{asset.identifier}</TableCell>
      <TableCell className="whitespace-nowrap">{areas.find((a) => a.id === asset.location_id)?.name}</TableCell>
      <TableCell className="whitespace-nowrap tabular-nums">
        {asset.acquired_on && formatDay(asset.acquired_on)}
      </TableCell>
      {showDisposed && (
        <TableCell className="whitespace-nowrap tabular-nums">
          {asset.disposed_on && formatDay(asset.disposed_on)}
        </TableCell>
      )}
      <TableCell className="text-right">
        {asset.value_cents !== null && <Money cents={asset.value_cents} whole />}
      </TableCell>
      <TableCell className="text-right">
        {failed && (
          <span role="alert" className="mr-2 text-sm text-destructive">
            {failed}
          </span>
        )}
        {items.length > 0 && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon" className="size-tap md:size-8" aria-label={label} />}
                  />
                }
              >
                <MoreHorizontalIcon aria-hidden />
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              {items.map((item) => (
                <DropdownMenuItem
                  key={item.key}
                  variant={item.key === "delete" ? "destructive" : "default"}
                  onClick={() => {
                    if (item.key === "return") {
                      setFailed(null);
                      actions.onDispose(asset, null).catch((error) => setFailed(refusalOf(error)));
                      return;
                    }
                    onPick(item.key);
                  }}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
}

/** Asks the day CSC sold, scrapped, or gave an asset away. It stays on the list, shown with Show disposed. */
function DisposeDialog({
  asset,
  name,
  day,
  onClose,
  onDispose,
}: {
  asset: Asset | null;
  name: string;
  day: string;
  onClose: () => void;
  onDispose: AssetActions["onDispose"];
}) {
  const [date, setDate] = useState(day);
  const [state, setState] = useState<{ kind: "idle" | "saving" } | { kind: "failed"; reason: string }>({
    kind: "idle",
  });
  const id = useId();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState({ kind: "saving" });
    try {
      await onDispose(asset!, date);
      onClose();
    } catch (error) {
      setState({ kind: "failed", reason: refusalOf(error) });
    }
  };
  return (
    <Dialog
      open={asset !== null}
      onOpenChange={(open) => {
        if (open) {
          return;
        }
        onClose();
        setDate(day);
        setState({ kind: "idle" });
      }}
    >
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Dispose of {name}?</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={id}>Sold, scrapped, or given away on</Label>
            <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          {state.kind === "failed" && (
            <p role="alert" className="text-sm text-destructive">
              {state.reason}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={state.kind === "saving" || !date}>
              {state.kind === "saving" ? "Working…" : "Dispose of"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Asks before deleting an asset, which is for one entered by mistake. */
function DeleteDialog({
  asset,
  name,
  onClose,
  onDelete,
}: {
  asset: Asset | null;
  name: string;
  onClose: () => void;
  onDelete: AssetActions["onDelete"];
}) {
  const [state, setState] = useState<"idle" | "working" | "failed">("idle");
  return (
    <Dialog
      open={asset !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setState("idle");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {name}?</DialogTitle>
          <DialogDescription>Use Dispose of for one CSC no longer has. This can&apos;t be undone.</DialogDescription>
        </DialogHeader>
        {state === "failed" && (
          <p role="alert" className="text-sm text-destructive">
            That didn&apos;t work. Try again.
          </p>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            variant="destructive"
            disabled={state === "working"}
            onClick={async () => {
              setState("working");
              try {
                await onDelete(asset!);
                onClose();
                setState("idle");
              } catch {
                setState("failed");
              }
            }}
          >
            {state === "working" ? "Working…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
