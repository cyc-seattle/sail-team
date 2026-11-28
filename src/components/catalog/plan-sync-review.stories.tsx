import type { SyncOffering } from "@cyc-seattle/platform/planning";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor } from "storybook/test";
import type { PlanSync } from "@/directus/plan-sync";
import { PlanSyncReview } from "./plan-sync-review";

// Made up: Budget, the plan in force for 2027, and what the catalog lacks of it.
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
const empty = { fields: [], schedule: null, adds: [], changes: [], archives: [], skipped: [] };
const plan = {
  id: "budget",
  name: "Budget",
  fiscal_year: 2027,
  status: "frozen" as const,
  effective_from: "2026-12-15",
};

const ready: PlanSync = {
  state: "ready",
  year: 2027,
  years: [2027, 2026],
  plan,
  names: {
    products: [
      { id: "guppies", name: "Guppies", program_area_id: "summer" },
      { id: "j-pod", name: "J-Pod", program_area_id: "doublehanded" },
    ],
    areas: [
      { id: "summer", name: "Summer" },
      { id: "doublehanded", name: "Doublehanded" },
    ],
    forms: [{ id: "summer-form", name: "2027 Summer Sailing Camps" }],
  },
  difference: {
    offerings: [
      {
        ...empty,
        offering: offering("week-1"),
        plan_offering_id: "p1",
        fields: [{ field: "price_cents", plan: 39_500, catalog: 37_500 }],
        schedule: {
          plan: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, start_time: "09:00:00", end_time: "15:00:00" })),
          catalog: [],
        },
        adds: ["21", "22", "23", "24", "25"].map((d) => ({
          plan_activity_id: d,
          date: `2027-06-${d}`,
          start_time: "09:00:00",
          end_time: "15:00:00",
        })),
      },
      {
        ...empty,
        offering: offering("spring", {
          product_id: "j-pod",
          name: "Spring",
          registration_form_id: null,
          starts_on: "2027-03-02",
        }),
        plan_offering_id: "p2",
        changes: [
          {
            activity_id: "a",
            date: "2027-03-02",
            start_time: "16:15:00",
            end_time: { catalog: "19:00:00", plan: "19:30:00" },
            restore: false,
          },
        ],
        archives: [{ activity_id: "b", date: "2027-03-04", start_time: "16:15:00" }],
        skipped: [{ plan_activity_id: "c", date: "2027-05-29" }],
      },
    ],
    archives: [offering("week-10", { name: "Week 10", starts_on: "2027-08-23", confirmed_count: 4 })],
  },
};

const meta = {
  component: PlanSyncReview,
  args: { sync: ready, onYear: fn(), onApply: fn(async () => new Map<string, string>()) },
} satisfies Meta<typeof PlanSyncReview>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every difference, by area, form and offering, all ticked but the archive of a week with sailors registered. */
export const Ready: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Apply 9 changes" })).toBeEnabled();
    await expect(canvas.getByRole("checkbox", { name: /Archive: The offering.*4 registered/ })).not.toBeChecked();
  },
};

/** Ticking an archive with registrations adds it to what's applied. */
export const TickAnArchive: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole("checkbox", { name: /Archive: The offering/ }));
    await userEvent.click(canvas.getByRole("button", { name: "Apply 10 changes" }));
    await waitFor(() => expect(args.onApply).toHaveBeenCalled());
    await expect((args.onApply as ReturnType<typeof fn>).mock.calls[0]![0]).toHaveLength(10);
  },
};

/** A row that couldn't be applied says why, and stays. */
export const Failed: Story = {
  args: { onApply: fn(async () => new Map([["week-1:price_cents", "You don't have permission to access this."]])) },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Apply 9 changes" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Couldn't apply: You don't have permission");
  },
};

/** The plan in force is a draft, which the sync refuses. */
export const Draft: Story = {
  args: { sync: { state: "draft", year: 2027, years: [2027], plan: { ...plan, name: "2027 Plan", status: "draft" } } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/it's a draft/)).toBeInTheDocument();
  },
};

/** No plan is in force for the year. */
export const NoneInForce: Story = { args: { sync: { state: "none", year: 2028, years: [2028, 2027] } } };

/** The catalog has everything. */
export const Nothing: Story = {
  args: { sync: { ...ready, difference: { offerings: [], archives: [] } } as PlanSync },
};
