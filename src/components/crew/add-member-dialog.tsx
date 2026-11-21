import { useNavigate } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { personName, type CrewPerson } from "@/model/crew";
import type { AddMember } from "./crew-list";
import { SaveFailed } from "./row-menu";
import { runSave, type SaveState } from "./save";

/**
 * Finds someone in People by name or email and puts them on Crew, then opens their page. Someone not in People yet is
 * added there first, by a CRM Writer.
 */
export function AddMemberDialog({
  open,
  onOpenChange,
  addMember,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addMember: AddMember;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <AddMemberForm addMember={addMember} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function AddMemberForm({ addMember, onDone }: { addMember: AddMember; onDone: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  // What a search found, and for what, so a reply to an older search never shows.
  const [result, setResult] = useState<{ q: string; people: CrewPerson[] } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [state, setState] = useState<SaveState>({ kind: "idle" });

  const searching = q.trim().length >= 2;
  useEffect(() => {
    if (!searching) {
      return;
    }
    // Waits for a pause in typing, so each letter isn't a request.
    const timer = setTimeout(() => {
      addMember
        .find(q)
        .then((people) => setResult({ q, people }))
        .catch(() => setResult({ q, people: [] }));
    }, 250);
    return () => clearTimeout(timer);
  }, [q, searching, addMember]);
  const found = searching && result?.q === q ? result.people : null;

  const person = found?.find((p) => p.id === picked);
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void runSave(
          async () => {
            const id = await addMember.add(person!);
            await navigate({ to: "/crew/$memberId", params: { memberId: id } });
          },
          setState,
          onDone,
        );
      }}
    >
      <DialogHeader>
        <DialogTitle>Add crew member</DialogTitle>
      </DialogHeader>
      <InputGroup className="h-tap md:h-8">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          autoFocus
          placeholder="Find by name or email"
          aria-label="Find by name or email"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPicked(null);
          }}
        />
      </InputGroup>
      {found !== null &&
        (found.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one matches.</p>
        ) : (
          <RadioGroup
            aria-label="People"
            value={picked}
            onValueChange={(v) => setPicked(String(v))}
            className="max-h-72 gap-0 overflow-y-auto"
          >
            {found.map((p) => {
              const already = addMember.onCrew.has(p.id);
              return (
                <Label
                  key={p.id}
                  className="flex min-h-tap cursor-pointer items-center gap-3 rounded-md px-2 font-normal hover:bg-muted has-data-disabled:cursor-default has-data-disabled:hover:bg-transparent md:min-h-9"
                >
                  <RadioGroupItem value={p.id} disabled={already} />
                  <span className="font-medium">{personName(p)}</span>
                  <span className="truncate text-muted-foreground">{already ? "Already on Crew" : p.email}</span>
                </Label>
              );
            })}
          </RadioGroup>
        ))}
      <SaveFailed state={state} />
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={!person || state.kind === "saving"}>
          {state.kind === "saving" ? "Working…" : "Add crew member"}
        </Button>
      </DialogFooter>
    </form>
  );
}
