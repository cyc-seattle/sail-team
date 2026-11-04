import type { Roster } from "@/model/roster";
import { RosterCard } from "./roster-card";

/** Every roster the person can see, by program, or a line saying there are none. */
export function RosterList({ rosters }: { rosters: Roster[] }) {
  if (rosters.length === 0) {
    return <p className="text-sm text-muted-foreground">There's no one on a roster for you to see right now.</p>;
  }
  return (
    <div className="grid items-start gap-card lg:grid-cols-2">
      {rosters.map((roster) => (
        <RosterCard key={roster.programId} roster={roster} />
      ))}
    </div>
  );
}
