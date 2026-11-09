import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneField } from "@/components/phone-field";
import { memberChanges, type Member, type MemberChanges, type School } from "@/model/household";
import { formatPhone, toE164 } from "@/model/phone";
import { said, type SaveState } from "./save-state.ts";
import { SchoolField, type SchoolChoice } from "./school-field.tsx";

export interface MemberCardProps {
  member: Member;
  /** The known schools a sailor's school is picked from. */
  schools: School[];
  /** Saves the form. It resolves once saved, and rejects if it didn't, which keeps the form open. */
  onSave: (changes: MemberChanges) => Promise<void>;
}

/** One person in the household: their name, email, phone, and a sailor's school, with a form to change all but the email. */
export function MemberCard({ member, schools, onSave }: MemberCardProps) {
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
    <section
      aria-labelledby={heading}
      className="grid content-start gap-3 rounded-lg bg-card p-card ring-1 ring-border"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 id={heading} className="font-medium">
          {member.name}
          {member.me && <span className="text-muted-foreground"> (you)</span>}
        </h2>
        {!editing && (
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
          schools={schools}
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
      <dd>{member.phone ? formatPhone(member.phone) : "None on file"}</dd>
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
  schools,
  saving,
  onCancel,
  onSave,
}: {
  member: Member;
  schools: School[];
  saving: boolean;
  onCancel: () => void;
  onSave: (changes: MemberChanges) => void;
}) {
  const id = useId();
  const [name, setName] = useState(member.displayName ?? "");
  const [phone, setPhone] = useState(toE164(member.phone));
  const [school, setSchool] = useState<SchoolChoice>({
    schoolId: member.schoolId,
    school: member.schoolId ? "" : (member.school ?? ""),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave(memberChanges(member, { name, phone: phone ?? "", ...school }));
  };
  return (
    <form onSubmit={submit} className="grid gap-3">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 text-sm">
        <dt className="text-muted-foreground">Email</dt>
        <dd className="break-all">{member.email ?? "None on file"}</dd>
      </dl>
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
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-phone`}>Phone</Label>
        <PhoneField id={`${id}-phone`} value={phone} onChange={setPhone} autoComplete={member.me ? "tel" : "off"} />
      </div>
      {member.hasSchool && <SchoolField schools={schools} value={school} onChange={setSchool} />}
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
