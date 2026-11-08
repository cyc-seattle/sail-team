import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { memberChanges, type Member, type MemberChanges } from "@/model/household";
import { said, type SaveState } from "./save-state.ts";

export interface MemberCardProps {
  member: Member;
  /** Whether the signed-in person may change them, which only an adult may. */
  editable?: boolean;
  /** Saves the form. It resolves once saved, and rejects if it didn't, which keeps the form open. */
  onSave: (changes: MemberChanges) => Promise<void>;
}

/** One person in the household: their name, email, phone, and a sailor's school, with a form to change what they may. */
export function MemberCard({ member, editable = true, onSave }: MemberCardProps) {
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<SaveState>("idle");
  const save = async (changes: MemberChanges) => {
    setState("saving");
    try {
      await onSave(changes);
    } catch {
      setState("failed");
      return;
    }
    setState("saved");
    setEditing(false);
  };
  const heading = useId();
  return (
    <section aria-labelledby={heading} className="grid gap-3 rounded-lg bg-card p-card ring-1 ring-border">
      <div className="flex items-start justify-between gap-2">
        <h2 id={heading} className="font-medium">
          {member.name}
          {member.me && <span className="text-muted-foreground"> (you)</span>}
        </h2>
        {editable && !editing && (
          <Button
            variant="outline"
            className="min-h-tap"
            onClick={() => {
              setEditing(true);
              setState("idle");
            }}
          >
            Edit<span className="sr-only"> {member.name}</span>
          </Button>
        )}
      </div>
      {editing ? (
        <MemberForm
          member={member}
          saving={state === "saving"}
          onCancel={() => setEditing(false)}
          onSave={(changes) => void save(changes)}
        />
      ) : (
        <Details member={member} />
      )}
      <p role="status" className={state === "failed" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
        {said[state]}
      </p>
    </section>
  );
}

function Details({ member }: { member: Member }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      <dt className="text-muted-foreground">Email</dt>
      <dd className="break-all">{member.email ?? "None on file"}</dd>
      <dt className="text-muted-foreground">Phone</dt>
      <dd>
        {member.phone ?? "None on file"}
        {!member.canEditPhone && <span className="block text-muted-foreground">Only they can change their phone.</span>}
      </dd>
      {member.hasSchool && (
        <>
          <dt className="text-muted-foreground">School</dt>
          <dd>{member.school ?? "None on file"}</dd>
        </>
      )}
    </dl>
  );
}

function MemberForm({
  member,
  saving,
  onCancel,
  onSave,
}: {
  member: Member;
  saving: boolean;
  onCancel: () => void;
  onSave: (changes: MemberChanges) => void;
}) {
  const id = useId();
  const [name, setName] = useState(member.displayName ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [school, setSchool] = useState(member.school ?? "");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave(memberChanges(member, { name, phone, school }));
  };
  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-name`}>Name</Label>
        <Input
          id={`${id}-name`}
          value={name}
          placeholder={member.name}
          aria-describedby={`${id}-name-hint`}
          onChange={(e) => setName(e.target.value)}
          className="min-h-tap"
        />
        <p id={`${id}-name-hint`} className="text-xs text-muted-foreground">
          Leave it blank to use the name on file.
        </p>
      </div>
      {member.canEditPhone && (
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-phone`}>Phone</Label>
          <Input
            id={`${id}-phone`}
            type="tel"
            autoComplete={member.me ? "tel" : "off"}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="min-h-tap"
          />
        </div>
      )}
      {member.hasSchool && (
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-school`}>School</Label>
          <Input id={`${id}-school`} value={school} onChange={(e) => setSchool(e.target.value)} className="min-h-tap" />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" className="min-h-tap" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="min-h-tap" disabled={saving}>
          Save
        </Button>
      </div>
    </form>
  );
}
