// Made-up families for the stories. Never real club members.
import type { RosterPerson, RosterSailor, TeamRoster } from "@/model/roster";

const person = (id: string, name: string, email: string | null = null, phone: string | null = null): RosterPerson => ({
  id,
  name,
  email,
  phone,
});

const sailor = (id: string, name: string, school: string | null, guardians: RosterPerson[]): RosterSailor => ({
  ...person(id, name),
  school,
  guardians,
});

export const pat = person("pat", "Pat Bowline", "pat.bowline@example.org", "+1 206 555 0141");
export const sam = person("sam", "Sam Bowline");
export const ada = sailor("ada", "Ada Bowline", "Lakeside Middle School", [pat, sam]);

export const doublehanded: TeamRoster = {
  id: "doublehanded",
  name: "Doublehanded",
  divisions: [
    {
      id: "j-pod",
      name: "J-Pod",
      group: { email: "j-pod@example.org", name: "J-Pod" },
      startsOn: "2026-09-08",
      endsOn: "2026-11-20",
      sailors: [
        ada,
        sailor("kai", "Kai Halyard", "Harbor View Middle School", [person("lee", "Lee Halyard")]),
        sailor("ola", "Ola Tack", null, [person("jo", "Jo Tack", "jo.tack@example.org")]),
      ],
    },
    {
      id: "k-pod",
      name: "K-Pod",
      group: null,
      startsOn: "2026-09-08",
      endsOn: "2026-11-20",
      sailors: [
        sailor("mia", "Mia Cleat", "Lakeside Middle School", [
          person("alex", "Alex Cleat", null, "+1 206 555 0150"),
          person("jordan", "Jordan Cleat"),
          person("sam-r", "Sam Rivera", "sam.rivera@example.org"),
        ]),
        { ...person("ren", "Ren Mainsheet", "ren@example.org", "+1 206 555 0177"), school: null, guardians: [] },
        sailor("kai", "Kai Halyard", "Harbor View Middle School", [person("lee", "Lee Halyard")]),
      ],
    },
  ],
};

export const singlehanded: TeamRoster = {
  id: "singlehanded",
  name: "Singlehanded",
  divisions: [{ ...doublehanded.divisions[1]!, id: "opti", name: "Opti Race Team", sailors: [ada] }],
};
