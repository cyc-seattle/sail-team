import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import {
  doublehandedOfferings,
  doublehandedPrograms,
  doublehandedStatement,
  summerOfferings,
  summerPrograms,
  summerStatement,
} from "./fixtures";
import { ProgramAreaReport } from "./program-area-report";

const meta = {
  component: ProgramAreaReport,
  args: { statement: doublehandedStatement, programs: doublehandedPrograms, offerings: doublehandedOfferings },
} satisfies Meta<typeof ProgramAreaReport>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Each program's spring comes before its fall, whatever order they were planned in. */
export const Doublehanded: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Offerings" });
    const names = [...table.querySelectorAll("tbody button")].map((b) => b.textContent);
    await expect(names.slice(0, 2)).toEqual(["J-Pod 1", "J-Pod 2"]);
    await expect(canvas.getByRole("table", { name: "Program settings" })).not.toBeVisible();
  },
};

/** The program settings open from the top of the page. */
export const SettingsOpen: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("Program settings", { selector: "h2" }));
    await expect(canvas.getByRole("table", { name: "Program settings" })).toBeVisible();
  },
};

export const Summer: Story = {
  args: { statement: summerStatement, programs: summerPrograms, offerings: summerOfferings },
};
