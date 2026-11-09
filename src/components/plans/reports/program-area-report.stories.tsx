import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
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
    const table = canvas.getByRole("table", { name: "Sailors and days" });
    const names = [...table.querySelectorAll("tbody button")].map((b) => b.textContent);
    await expect(names.slice(0, 2)).toEqual(["J-Pod 1", "J-Pod 2"]);
  },
};

export const Summer: Story = {
  args: { statement: summerStatement, programs: summerPrograms, offerings: summerOfferings },
};
