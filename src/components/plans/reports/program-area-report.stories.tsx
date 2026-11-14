import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import {
  doublehandedOfferings,
  doublehandedPrograms,
  doublehandedRules,
  doublehandedSeasons,
  doublehandedStatement,
  summerOfferings,
  summerPrograms,
  summerRules,
  summerSeasons,
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
    setId: "budget",
    areaKey: "doublehanded",
    area: "Doublehanded",
    rules: doublehandedRules,
    warnings: warnings.filter((w) => w.area === "doublehanded"),
    statement: doublehandedStatement,
    seasons: doublehandedSeasons,
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
    const table = canvas.getByRole("table", { name: "Offerings" });
    const names = [...table.querySelectorAll("tbody button")].map((b) => b.textContent);
    await expect(names.slice(0, 2)).toEqual(["J-Pod Spring", "J-Pod Summer"]);
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
    seasons: summerSeasons,
    programs: summerPrograms,
    offerings: summerOfferings,
    areaKey: "summer",
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

/** Each season's bonus stands alone: summer loses money and pays no bonus. */
export const BySeason: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "By season" });
    const rows = [...table.querySelectorAll("tbody tr")].map((r) =>
      [...r.querySelectorAll("td")].map((c) => c.textContent),
    );
    await expect(rows.map((r) => r[0])).toEqual(["Spring", "Summer", "Fall"]);
    await expect(rows[1]).toEqual(["Summer", "$30,000", "$33,000", "−$3,000", "$0"]);
    await expect(canvas.getByRole("columnheader", { name: "Program Director's bonus" })).toBeVisible();
  },
};

/** An area with no seasons shows no season table, since its year says the same. */
export const NoSeasons: Story = {
  args: { seasons: { bonuses: [], rows: [] } },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("table", { name: "By season" })).toBeNull();
  },
};
