import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import {
  closedDays,
  doublehandedOfferings,
  doublehandedSchedule,
  summerSchedule,
  doublehandedPrograms,
  doublehandedRules,
  doublehandedStatement,
  summerOfferings,
  summerPrograms,
  summerRules,
  doublehandedTrips,
  summerFixedCosts,
  summerStaffTime,
  summerStatement,
  warnings,
} from "./fixtures";
import { withRouter } from "../../../../.storybook/with-router";
import { ProgramAreaReport } from "./program-area-report";

const meta = {
  component: ProgramAreaReport,
  decorators: [withRouter("/plans/financial/budget/doublehanded", ["/plans/financial/$setId/$planId"])],
  args: {
    areaKey: "doublehanded",
    schedule: doublehandedSchedule,
    closedDays,
    area: "Doublehanded",
    rules: doublehandedRules,
    warnings: warnings.filter((w) => w.area === "doublehanded"),
    statement: doublehandedStatement,
    programs: doublehandedPrograms,
    offerings: doublehandedOfferings,
    trips: doublehandedTrips,
    fixedCosts: [],
    staffTime: [],
  },
} satisfies Meta<typeof ProgramAreaReport>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Each program's spring comes before its fall, whatever order they were planned in. */
export const Doublehanded: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Fees" });
    const names = [...table.querySelectorAll("tbody button")].map((b) => b.textContent);
    await expect(names.slice(0, 2)).toEqual(["J-Pod Spring", "J-Pod Summer"]);
    await expect(canvas.getByRole("list", { name: "J-Pod rules" })).not.toBeVisible();
  },
};

/** The area's assumptions open from the top of the page. */
/** Max and Capacity say what they mean on hover. */
export const EnrollmentHelp: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Enrollment" });
    await expect([...table.querySelectorAll("thead th")].map((h) => h.textContent)).toEqual([
      "Offering",
      "Break even",
      "Max",
      "Capacity",
      "Target",
      "Sailor-days",
      "Sailor-hours",
    ]);
    await userEvent.hover(within(table).getByRole("button", { name: "What Capacity means" }));
    await expect(
      await within(document.body).findByText("The most sailors the coaches and boats given to its blocks can take"),
    ).toBeVisible();
  },
};

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
    areaKey: "summer",
    schedule: summerSchedule,
    trips: [],
    fixedCosts: summerFixedCosts,
    staffTime: summerStaffTime,
  },
};

/** Its offerings link to the Calendar, showing only this area. */
export const SeeOnTheCalendar: Story = {
  args: Summer.args!,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "See on the calendar" })).toHaveAttribute(
      "href",
      "/plans/financial/budget/calendar?area=summer",
    );
  },
};

/** A trip names its offering, and what each coach's travel takes. */
export const DoublehandedTrips: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("Trips", { selector: "h2" }));
    await expect(canvas.getByRole("row", { name: /Nationals/ })).toHaveTextContent("NationalsK-Pod Summer5$450—");
  },
};
