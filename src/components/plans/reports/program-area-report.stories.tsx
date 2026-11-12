import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
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

/** The weeks with each program's sailors, then a week's blocks by day, then one block in full. */
export const SummerSchedule: Story = {
  args: Summer.args!,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("Schedule", { selector: "h2" }));
    await expect(canvas.getByRole("table", { name: "Weeks" })).toHaveTextContent("9 / 10");
    await userEvent.click(canvas.getByRole("button", { name: "Jun 28" }));
    await expect(canvas.getByRole("table", { name: "Week of Jun 28" })).toHaveTextContent("Morning dock");
    await userEvent.click(canvas.getByRole("button", { name: "Race Camp, Wednesday, June 30" }));
    await expect(canvas.getByRole("region", { name: "Race Camp · Wednesday, June 30" })).toHaveTextContent(
      "1:00 PM–4:00 PM",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Morning dock" }));
    await expect(canvas.getByRole("list", { name: "How it differs" })).toHaveTextContent(
      "Mon 28: 2 Level 1 Instructors",
    );
  },
};
