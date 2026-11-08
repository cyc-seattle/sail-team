import type { Household, MemberChanges } from "@/model/household";
import { MemberCard } from "./member-card.tsx";
import type { SaveState } from "./save-state.ts";
import { ShareContact } from "./share-contact.tsx";

export interface HouseholdViewProps {
  household: Household;
  shareState?: SaveState;
  onShareChange: (shares: boolean) => void;
  onSaveMember: (personId: string, changes: MemberChanges) => Promise<void>;
}

/** The household's sharing choice, then a card for each person in it. */
export function HouseholdView({ household, shareState = "idle", onShareChange, onSaveMember }: HouseholdViewProps) {
  return (
    <div className="grid gap-card">
      <ShareContact
        shares={household.shares}
        state={shareState}
        disabled={!household.editable}
        onChange={onShareChange}
      />
      <div className="grid gap-card md:grid-cols-2">
        {household.members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            editable={household.editable}
            onSave={(changes) => onSaveMember(member.id, changes)}
          />
        ))}
      </div>
    </div>
  );
}
