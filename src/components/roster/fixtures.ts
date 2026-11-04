// Made-up families for the stories. Never real club members.
import type { Roster, RosterPerson } from "@/model/roster";

const person = (id: string, name: string, email: string | null = null, phone: string | null = null): RosterPerson => ({
  id,
  name,
  email,
  phone,
});

export const raceTeam: Roster = {
  programId: "race-team",
  program: "Youth Race Team",
  team: true,
  startsOn: "2026-09-08",
  endsOn: "2026-11-20",
  sailors: [
    {
      ...person("ada", "Ada Bowline"),
      parents: [
        person("pat", "Pat Bowline", "pat.bowline@example.org", "+1 206 555 0141"),
        person("sam", "Sam Bowline"),
      ],
    },
    { ...person("kai", "Kai Halyard"), parents: [person("lee", "Lee Halyard")] },
    { ...person("ren", "Ren Mainsheet", "ren@example.org", "+1 206 555 0177"), parents: [] },
  ],
};

export const ownFamily: Roster = {
  programId: "camp",
  program: "Summer Camp",
  team: false,
  startsOn: "2026-07-06",
  endsOn: "2026-07-17",
  sailors: [{ ...person("ada", "Ada Bowline"), parents: [person("pat", "Pat Bowline")] }],
};
