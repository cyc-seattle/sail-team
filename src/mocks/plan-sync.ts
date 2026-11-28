// What the plan-to-catalog sync reads, made up: the catalog offerings Budget, the plan in force for 2027, plans, with
// a few values the catalog has otherwise, a schedule and activities, and a week another 2027 draft plans.
import { catalogTables } from "./catalog";
import { catalogOfferings, ids, tables } from "./plans";

type Row = Record<string, unknown>;

const summerForm = { id: "form-summer-2027", name: "2027 Summer Sailing Camps" };
const budgetPlans = [ids.summerBudget, ids.doublehandedBudget, ids.opsBudget];
const planned = tables["plan_offerings"]!.filter((o) => budgetPlans.includes(o["plan_id"] as string));
const offeringOf = (o: Row) => (o["offering_id"] as { id: string }).id;

// Values the catalog has that the plan in force changed, by the offering's name.
const differs: Record<string, Row> = {
  "Guppies Week 2": { price_cents: 37_500 },
  "Sea Otters Week 1": { capacity: 8 },
  "Opti Camp Week 3": { starts_on: null, ends_on: null },
};

const catalogRows: Row[] = planned.map((o) => {
  const catalog = catalogOfferings.get(offeringOf(o))!;
  return {
    id: catalog.id,
    product_id: catalog.product_id,
    name: catalog.name,
    registration_form_id: o["plan_id"] === ids.summerBudget ? summerForm.id : null,
    starts_on: o["starts_on"],
    ends_on: o["ends_on"],
    capacity: o["capacity"],
    price_cents: o["price_cents"],
    archived_at: null,
    confirmed_count: 6,
    ...differs[catalog.name],
  };
});

// A week only the "Two coaches" draft plans, with sailors already registered, which the sync offers to archive.
const cut = { id: "catalog:Guppies Week 10", product_id: catalogRows[0]!["product_id"], name: "Guppies Week 10" };
catalogRows.push({
  ...cut,
  registration_form_id: summerForm.id,
  starts_on: "2027-08-23",
  ends_on: "2027-08-27",
  capacity: 12,
  price_cents: 39_500,
  archived_at: null,
  confirmed_count: 4,
});
const cutPlanned: Row = {
  id: "plan-offering-guppies-week-10",
  plan_id: ids.summerTwo,
  offering_id: { id: cut.id, name: cut.name, product_id: { id: cut.product_id } },
  starts_on: "2027-08-23",
  ends_on: "2027-08-27",
  capacity: 12,
  price_cents: 39_500,
};

// Guppies Week 1 already has its activities, one ending earlier than the plan says, and its schedule.
const week1 = catalogOfferings.get("catalog:Guppies Week 1")!;
const week1Planned = planned.find((o) => offeringOf(o) === week1.id)!;
const week1Activities = tables["plan_activities"]!.filter((a) => a["offering_id"] === week1Planned["id"]);
const activities: Row[] = week1Activities.map((a, i) => ({
  id: `activity-guppies-week-1-${i}`,
  offering_id: week1.id,
  date: a["date"],
  start_time: a["start_time"],
  end_time: i === 2 ? "11:30:00" : a["end_time"],
  archived_at: null,
}));

/** The sync's tables, which come before the others': offerings and plan offerings with the sync's added. */
export const planSyncTables: Record<string, Row[]> = {
  registration_forms: [summerForm],
  offering_schedule: [],
  activities,
  offerings: [...catalogTables["offerings"]!, ...catalogRows],
  plan_offerings: [...tables["plan_offerings"]!, cutPlanned],
};
