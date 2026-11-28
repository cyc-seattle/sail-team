import type { SyncOffering } from "@cyc-seattle/platform/planning";
import { describe, expect, it } from "vitest";
import { describeRow, scheduleText, syncGroups, ticked, type SyncNames } from "../src/model/plan-sync";

// The plan-to-catalog sync's review (cyc-seattle/platform#395). Every figure is made up.

const offering = (id: string, fields: Partial<SyncOffering> = {}): SyncOffering => ({
  id,
  product_id: "guppies",
  name: "Week 1",
  registration_form_id: "summer-form",
  starts_on: "2027-06-21",
  ends_on: "2027-06-25",
  capacity: 12,
  price_cents: 39_500,
  archived_at: null,
  confirmed_count: 0,
  ...fields,
});

const names: SyncNames = {
  products: [
    { id: "guppies", name: "Guppies", program_area_id: "summer" },
    { id: "j-pod", name: "J-Pod", program_area_id: "doublehanded" },
    { id: "storage", name: "Boat storage", program_area_id: null },
  ],
  areas: [
    { id: "summer", name: "Summer" },
    { id: "doublehanded", name: "Doublehanded" },
  ],
  forms: [{ id: "summer-form", name: "2027 Summer Sailing Camps" }],
};

const empty = { fields: [], schedule: null, adds: [], changes: [], archives: [], skipped: [] };

describe("the sync's review", () => {
  const difference = {
    offerings: [
      {
        ...empty,
        offering: offering("week-2", { name: "Week 2", starts_on: "2027-06-28" }),
        plan_offering_id: "p2",
        fields: [{ field: "price_cents" as const, plan: 39_500, catalog: 37_500 }],
      },
      {
        ...empty,
        offering: offering("week-1"),
        plan_offering_id: "p1",
        skipped: [{ plan_activity_id: "a", date: "2027-06-21" }],
      },
      {
        ...empty,
        offering: offering("spring", { product_id: "j-pod", name: "Spring", registration_form_id: null }),
        plan_offering_id: "p3",
        adds: [{ plan_activity_id: "b", date: "2027-03-02", start_time: "16:00:00", end_time: "19:00:00" }],
      },
    ],
    archives: [offering("week-10", { name: "Week 10", starts_on: "2027-08-23", confirmed_count: 4 })],
  };

  it("groups by program area, then registration form, then offering by its first day", () => {
    const groups = syncGroups(difference, names);
    expect(
      groups.map((g) => [g.area?.name, g.forms.map((f) => [f.form?.name ?? null, f.offerings.map((o) => o.label)])]),
    ).toEqual([
      ["Doublehanded", [[null, ["J-Pod Spring"]]]],
      ["Summer", [["2027 Summer Sailing Camps", ["Guppies Week 1", "Guppies Week 2", "Guppies Week 10"]]]],
    ]);
  });

  it("ticks every row to start with, but an archive of an offering with registrations, and a skipped activity", () => {
    expect([...ticked(syncGroups(difference, names))].sort()).toEqual([
      "spring:add:2027-03-02:16:00:00",
      "week-2:price_cents",
    ]);
  });

  it("says what each row does in words", () => {
    const rows = syncGroups(difference, names).flatMap((g) =>
      g.forms.flatMap((f) => f.offerings.flatMap((o) => o.rows)),
    );
    expect(rows.map(describeRow)).toEqual([
      { action: "Add", what: "Tue, Mar 2, 4 pm–7 pm" },
      { action: "Skipped", what: "Mon, Jun 21: no start or end time" },
      { action: "Change", what: "Price: $375 to $395" },
      {
        action: "Archive",
        what: "Offering not in the plan in force. 4 registered.",
      },
    ]);
  });
});

describe("a schedule in words", () => {
  it("puts days at the same times together, and three or more in a row as a range", () => {
    expect(
      scheduleText([
        { weekday: 2, start_time: "16:15:00", end_time: "19:30:00" },
        { weekday: 4, start_time: "16:15:00", end_time: "19:30:00" },
        { weekday: 6, start_time: "10:00:00", end_time: "14:00:00" },
      ]),
    ).toBe("Tue & Thu 4:15 pm–7:30 pm, Sat 10 am–2 pm");
    expect(
      scheduleText([1, 2, 3, 4, 5].map((weekday) => ({ weekday, start_time: "09:00:00", end_time: "15:00:00" }))),
    ).toBe("Mon–Fri 9 am–3 pm");
    expect(scheduleText([])).toBe("none");
  });
});
