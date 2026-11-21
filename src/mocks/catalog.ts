// Made-up catalog details, for local work and tests. Never real club data.
import { tables } from "./plans";

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

const offering = (n: number, program: string, name: string) => ({
  id: id(9300 + n),
  program_id: programId(program),
  name,
});

const qualifications = [
  { id: id(9400), name: "US Sailing Level 1" },
  { id: id(9401), name: "US Sailing Level 2" },
  { id: id(9402), name: "Powerboat Safety" },
  { id: id(9403), name: "First Aid and CPR" },
  { id: id(9404), name: "SafeSport" },
];

/** The catalog's tables, as Directus returns them. */
export const catalogTables: Record<string, Row[]> = {
  accounts,
  products,
  catalog_offerings: [
    offering(1, "Guppies", "week 1"),
    offering(2, "Guppies", "week 2"),
    offering(3, "Guppies", "week 10"),
    offering(4, "J-Pod", "fall practices"),
    offering(5, "J-Pod", "spring practices"),
    offering(6, "Opti Camp", "week 1"),
  ],
  qualifications,
  // Level 2 also meets a Level 1 requirement.
  qualification_covers: [{ id: id(9450), qualification_id: id(9401), covers_id: id(9400) }],
};
