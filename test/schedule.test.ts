import { describe, expect, it } from "vitest";
import type { NumberedOffering } from "../src/model/reports.ts";
import {
  blockName,
  busiestWeek,
  counted,
  daysOf,
  patternsOf,
  sailorsIn,
  scheduleOf,
  weekdaysOf,
  weekName,
  weeksOf,
  type ScheduleBlock,
} from "../src/model/schedule.ts";

const activity = (key: string, offering: string, start: string, end = "12:00:00") => ({
  key,
  offering_key: offering,
  kind: "practice" as const,
  start_time: start,
  end_time: end,
  setup_minutes: 30,
  putaway_minutes: 30,
  on_water_minutes: 120,
});
const block = (date: string, parts: string[], ...activities: ReturnType<typeof activity>[]): ScheduleBlock => ({
  key: `b ${date} ${activities.map((a) => a.offering_key).join()}`,
  date,
  name: "Morning dock",
  activities,
  parts,
});
const offering = (program: string, n: number, estimated: number, max: number): NumberedOffering => ({
  key: `${program} ${n}`,
  program,
  session: `Week ${n}`,
  starts_on: "2027-06-21",
  ends_on: "2027-06-25",
  fee_cents: 0,
  estimated,
  max,
  days: 5,
  hours: 10,
  label: `${program} ${n}`,
});
const offerings = new Map(
  [offering("Guppies", 1, 6, 10), offering("Guppies", 2, 9, 10), offering("Sea Otters", 1, 10, 12)].map((o) => [
    o.key,
    o,
  ]),
);
const usual = ["3 Level 1 Instructors", "2 RIBs", "6 Sailqubes"];
const week1 = ["2027-06-21", "2027-06-22", "2027-06-23"].map((d) =>
  block(d, usual, activity(`g ${d}`, "Guppies 1", "09:00:00"), activity(`o ${d}`, "Sea Otters 1", "09:00:00")),
);
const week2 = [
  block("2027-06-28", ["2 Level 1 Instructors", "2 RIBs", "6 Sailqubes"], activity("g2a", "Guppies 2", "09:00:00")),
  block("2027-06-29", ["2 Level 1 Instructors", "2 RIBs", "6 Sailqubes"], activity("g2b", "Guppies 2", "09:00:00")),
  block("2027-06-30", [], activity("g2c", "Guppies 2", "09:00:00")),
];

describe("counted", () => {
  it("says how many, as one or as many", () => {
    expect(counted(1, "RIBs")).toBe("1 RIB");
    expect(counted(2, "RIBs")).toBe("2 RIBs");
    expect(counted(3, "Level 3 Coach")).toBe("3 Level 3 Coaches");
    expect(counted(14, "Opti")).toBe("14 Optis");
  });
});

describe("blockName", () => {
  it("is none when it only repeats its date and names already on the page", () => {
    const known = ["Doublehanded", "J-Pod", "J-Pod Spring"];
    expect(blockName("J-Pod 2027-03-02", "2027-03-02", known)).toBeNull();
    expect(blockName("Morning dock 2027-03-02", "2027-03-02", known)).toBe("Morning dock");
    expect(blockName("J-Pod and K-Pod together", "2027-03-02", known)).toBe("J-Pod and K-Pod together");
  });
});

describe("scheduleOf", () => {
  it("lists each block by date, with what it shares, and an activity in no block on its own", () => {
    const row = (key: string, start: string, block_id: string | null) => ({
      id: key,
      key,
      offering_id: "o",
      block_id,
      date: "2027-03-02",
      kind: "practice" as const,
      uses_boats: true,
      start_time: start,
      end_time: "18:00:00",
      on_water_minutes: null,
      setup_minutes: 15,
      putaway_minutes: null,
    });
    const schedule = scheduleOf(
      [{ id: "b", key: "b", date: "2027-03-02", name: "Tuesday practice" }],
      [row("late", "17:00:00", null), row("a", "16:00:00", "b")],
      {
        staff: [
          { block_id: "b", staff_level: null, position: "Head Coach", count: 1, pay: "hourly" },
          { block_id: "b", staff_level: "Level 3 Coach", position: null, count: 2, pay: null },
        ],
        resources: [{ block_id: "b", resource: "RIBs", quantity: 1, hours: 2.5 }],
        boats: [{ block_id: "b", boat_class: "420", count: 3, sailor_owned: 3 }],
      },
      () => "J-Pod 1",
    );
    expect(schedule.map((b) => [b.name, b.activities.map((a) => a.key), b.parts])).toEqual([
      [
        "Tuesday practice",
        ["a"],
        ["1 Head Coach, by the hour", "2 Level 3 Coaches", "1 RIB, 2.5 hours each", "3 420s, plus 3 sailors' own"],
      ],
      [null, ["late"], []],
    ]);
    expect(schedule[0]?.activities[0]?.on_water_minutes).toBe(120);
  });
});

describe("weekdaysOf", () => {
  it("names the days of the week", () => {
    expect(weekdaysOf(["2027-06-21", "2027-06-22", "2027-06-23", "2027-06-24", "2027-06-25"])).toBe("Weekdays");
    expect(weekdaysOf(["2027-03-02", "2027-03-09"])).toBe("Tuesdays");
    expect(weekdaysOf(["2027-03-03", "2027-03-01", "2027-03-05"])).toBe("Mondays, Wednesdays, and Fridays");
  });
});

describe("patternsOf", () => {
  it("writes repeating blocks once, with what most days share and the days that differ", () => {
    const [dock] = patternsOf([...week1, ...week2], offerings);
    expect(dock).toMatchObject({
      title: "Morning dock",
      weekdays: "Mondays, Tuesdays, and Wednesdays",
      days: 6,
      programs: [
        { program: "Guppies", offerings: "Guppies 1–2", time: "9:00 AM–12:00 PM" },
        { program: "Sea Otters", offerings: "Sea Otters 1", time: "9:00 AM–12:00 PM" },
      ],
      parts: usual,
      exceptions: ["Jun 28 to 29: 2 Level 1 Instructors", "Jun 30: no staff, coach boats or boats yet"],
    });
  });

  it("names blocks with no name by their programs, apart from blocks with other programs", () => {
    const alone = week2.map((b) => ({ ...b, name: null }));
    expect(patternsOf([...week1, ...alone], offerings).map((p) => p.title)).toEqual(["Morning dock", "Guppies"]);
  });

  it("counts an activity in no block as a day that differs, among named blocks at the same times", () => {
    const named = week2.slice(0, 2);
    const alone = { ...week2[2]!, name: null };
    const [guppies] = patternsOf([...named, alone], offerings);
    expect(guppies?.title).toBe("Morning dock");
    expect(guppies?.exceptions).toEqual(["Jun 30: no staff, coach boats or boats yet"]);
  });

  it("joins consecutive days that differ the same way", () => {
    const days = ["2027-07-12", "2027-07-13", "2027-07-14", "2027-07-15", "2027-07-19"].map((d, i) =>
      block(d, i < 2 ? ["11 Sailqubes"] : ["6 Sailqubes"], activity(`g ${d}`, "Guppies 1", "09:00:00")),
    );
    expect(patternsOf(days, offerings)[0]?.exceptions).toEqual(["Jul 12 to 13: 11 Sailqubes"]);
  });
});

describe("weeks and days", () => {
  const blocks = [...week1, ...week2];

  it("lists every week from the first block's to the last's, and opens on the busiest", () => {
    expect(weeksOf(blocks)).toEqual(["2027-06-21", "2027-06-28"]);
    expect(busiestWeek(blocks)).toBe("2027-06-21");
    expect(daysOf(blocks, "2027-06-28")).toEqual(["2027-06-28", "2027-06-29", "2027-06-30"]);
    expect(weekName("2027-06-28", daysOf(blocks, "2027-06-28"))).toBe("Jun 28 to 30");
  });

  it("adds up each program's estimated and max sailors in a week, each offering once", () => {
    expect(sailorsIn(blocks, "2027-06-21", offerings)).toEqual(
      new Map([
        ["Guppies", { estimated: 6, max: 10 }],
        ["Sea Otters", { estimated: 10, max: 12 }],
      ]),
    );
  });
});
