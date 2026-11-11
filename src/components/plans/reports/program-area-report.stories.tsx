import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import {
  doublehandedOfferings,
  doublehandedPrograms,
  doublehandedRules,
  doublehandedStatement,
  summerOfferings,
  summerPrograms,
  summerRules,
  doublehandedTrips,
  summerFixedCosts,
  summerSchedule,
  summerStaffTime,
  summerStatement,
  warnings,
} from "./fixtures";
import { ProgramAreaReport } from "./program-area-report";

const meta = {
  component: ProgramAreaReport,
  args: {
    area: "Doublehanded",
    rules: doublehandedRules,
    warnings: warnings.filter((w) => w.area === "doublehanded"),
    statement: doublehandedStatement,
    programs: doublehandedPrograms,
    offerings: doublehandedOfferings,
    trips: doublehandedTrips,
    schedule: [],
    fixedCosts: [],
    staffTime: [],
  },
} satisfies Meta<typeof ProgramAreaReport>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Each program's spring comes before its fall, whatever order they were planned in. */
export const Doublehanded: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Offerings" });
    const names = [...table.querySelectorAll("tbody button")].map((b) => b.textContent);
    await expect(names.slice(0, 2)).toEqual(["J-Pod 1", "J-Pod 2"]);
    await expect(canvas.getByRole("list", { name: "J-Pod rules" })).not.toBeVisible();
  },
};

/** The area's assumptions open from the top of the page. */
export const AssumptionsOpen: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("Assumptions", { selector: "h2" }));
    await expect(canvas.getByRole("list", { name: "J-Pod rules" })).toBeVisible();
  },
};

export const Summer: Story = {
  args: {
    area: "Summer",
    rules: summerRules,
    warnings: warnings.filter((w) => w.area === "summer"),
    statement: summerStatement,
    programs: summerPrograms,
    offerings: summerOfferings,
    trips: [],
    schedule: summerSchedule,
    fixedCosts: summerFixedCosts,
    staffTime: summerStaffTime,
  },
};

/** Each block's activities share its staff, coach boats and boats; an activity in no block stands alone. */
export const SummerSchedule: Story = {
  args: Summer.args!,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("Schedule", { selector: "h2" }));
    const schedule = canvas.getByRole("table", { name: "Schedule" });
    await expect(schedule).toHaveTextContent("Level 1 Instructor: 3");
    await expect(within(schedule).getAllByRole("row", { name: /Opti Camp 1/ })[0]).toHaveTextContent("9:00 AM–3:00 PM");
    await expect(within(schedule).getByRole("row", { name: /Race Camp 1, Clinic/ })).toHaveTextContent("2.5 hours");
  },
};

/** A trip names its offering, and what each coach's travel takes. */
export const DoublehandedTrips: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("Trips", { selector: "h2" }));
    await expect(canvas.getByRole("row", { name: /Nationals/ })).toHaveTextContent("NationalsK-Pod 25$450—");
  },
};
