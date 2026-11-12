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
  summerFixedCosts,
  summerScheduleProps,
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
    schedule: { blocks: [], closedDays: [], elsewhere: [] },
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
    schedule: summerScheduleProps,
    fixedCosts: summerFixedCosts,
    staffTime: summerStaffTime,
  },
};

/** Repeating blocks are written once, with the days that differ; a week shows each program's sailors each day. */
export const SummerSchedule: Story = {
  args: Summer.args!,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("Schedule", { selector: "h2" }));
    const dock = within(canvas.getByRole("region", { name: "Activity blocks" })).getByRole("article", {
      name: "Morning dock",
    });
    await expect(dock).toHaveTextContent("Weekdays, Jun 21 to Aug 20");
    await expect(within(dock).getByRole("list", { name: "Morning dock: days that differ" })).toHaveTextContent(
      "Jul 12 to 16: 11 Sailqubes",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Jul 12" }));
    await expect(canvas.getByRole("table", { name: "Weeks" })).toHaveTextContent("9 / 10");
    await expect(canvas.getByRole("table", { name: "Week of Jul 12" })).toHaveTextContent("Morning dock");
    await userEvent.click(canvas.getByRole("button", { name: "Wed 14" }));
    await expect(canvas.getByRole("heading", { name: "Wednesday, July 14" })).toBeVisible();
    await expect(canvas.getByRole("article", { name: "Race Camp" })).toHaveTextContent("1:00 PM–4:00 PM");
  },
};
