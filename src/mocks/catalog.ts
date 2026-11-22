// Made-up catalog details, for local work and tests. Never real club data.
import { tables } from "./plans";
import { rosterTables } from "./roster";

type Row = Record<string, unknown>;

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

/** Where each account goes on Form 990, by number. */
const form990: Record<string, [string, string]> = {
  "4100": ["VIII", "2a"],
  "4200": ["VIII", "2a"],
  "4500": ["VIII", "1f"],
  "5010": ["IX", "7"],
  "5030": ["IX", "7"],
  "5020": ["IX", "10"],
  "6110": ["IX", "23"],
  "6310": ["IX", "16"],
};

const accounts: Row[] = [
  ...tables["accounts"]!.map((a) => {
    const [part, line] = form990[a["number"] as string] ?? [null, null];
    return { ...a, form_990_part: part, form_990_line: line };
  }),
  {
    id: id(37),
    number: "4110",
    name: "Summer camp refunds",
    type: "revenue",
    form_990_part: null,
    form_990_line: null,
    default_function: "program",
    parent_id: null,
    contra_account_id: id(21),
    retired: false,
  },
  {
    id: id(38),
    number: "5120",
    name: "Launch fuel",
    type: "expense",
    form_990_part: null,
    form_990_line: null,
    default_function: "program",
    parent_id: null,
    contra_account_id: null,
    retired: true,
  },
];

/** Each program's details: whether it's a team, its color, and its Google Group. */
const programDetails: Record<string, { team?: boolean; color?: string; group?: string }> = {
  Guppies: { color: "#0274c7" },
  "J-Pod": { team: true, group: "jpod@example.org" },
  "Opti Camp": { color: "#e8a33d" },
};

const products: Row[] = tables["products"]!.map((p) => {
  const name = p["name"] as string;
  const details = programDetails[name] ?? {};
  return {
    ...p,
    programs:
      p["kind"] === "program"
        ? [
            {
              id: `program-${p["id"] as string}`,
              name,
              team: details.team ?? false,
              color: details.color ?? null,
              google_group_id: details.group ? { name: `${name} parents`, email: details.group } : null,
            },
          ]
        : [],
  };
});

const programId = (name: string) => `program-${tables["products"]!.find((p) => p["name"] === name)!["id"] as string}`;

const offering = (
  n: number,
  program: string,
  name: string,
  [starts_on, ends_on]: [string, string],
  price_cents: number | null,
  capacity: number | null,
  archived_at: string | null = null,
) => ({
  id: id(9300 + n),
  program_id: programId(program),
  name,
  starts_on,
  ends_on,
  price_cents,
  capacity,
  archived_at,
});

const qualifications = [
  { id: id(9400), name: "US Sailing Level 1" },
  { id: id(9401), name: "US Sailing Level 2" },
  { id: id(9402), name: "Powerboat Safety" },
  { id: id(9403), name: "First Aid and CPR" },
];

/** The catalog's tables, as Directus returns them. */
export const catalogTables: Record<string, Row[]> = {
  accounts,
  products,
  // With the roster's, since Directus keeps them in one table.
  offerings: [
    offering(1, "Guppies", "Week 1", ["2027-06-21", "2027-06-25"], 67500, 12),
    offering(2, "Guppies", "Week 2", ["2027-06-28", "2027-07-02"], 67500, 12),
    offering(3, "Guppies", "Week 10", ["2027-08-23", "2027-08-27"], 67500, 12),
    offering(4, "J-Pod", "Fall", ["2027-09-07", "2027-11-07"], 61000, 15),
    offering(5, "J-Pod", "Spring", ["2027-03-01", "2027-05-23"], 85000, 15),
    offering(6, "Opti Camp", "Week 1", ["2027-06-21", "2027-06-25"], 65050, null),
    offering(7, "Guppies", "Week 1", ["2026-06-22", "2026-06-26"], null, 12),
    offering(8, "Opti Camp", "Week 2", ["2027-06-28", "2027-07-02"], 65000, 10, "2026-11-01T00:00:00Z"),
    ...rosterTables["offerings"]!,
  ],
  qualifications,
  // Level 2 also meets a Level 1 requirement.
  qualification_covers: [{ id: id(9450), qualification_id: id(9401), covers_id: id(9400) }],
};
