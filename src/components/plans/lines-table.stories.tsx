import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withUnitSwitch } from "../../../.storybook/with-unit-switch";
import { statement } from "@/model/plan-lines";
import { lines, measures } from "./fixtures";
import { LinesTable } from "./lines-table";

const youth = statement(lines.filter((l) => l.member === "youth"));

const meta = {
  component: LinesTable,
  args: {
    label: "Revenue and expenses",
    sections: [
      { title: "Revenue", categories: youth.revenue },
      { title: "Expenses", categories: youth.expenses },
    ],
    measures,
    net: true,
  },
  decorators: [withUnitSwitch],
} satisfies Meta<typeof LinesTable>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ByCategory: Story = {
  play: async ({ canvas }) => {
    // Coach wages, added up across the three offerings.
    await expect(canvas.getByRole("row", { name: /^Coach wages\s*5000 \$5,760$/ })).toBeVisible();
    await expect(canvas.getByRole("row", { name: /Boats and equipment total/ })).toHaveTextContent("$1,760");
    await expect(canvas.getByRole("row", { name: /^Net/ })).toBeVisible();
  },
};

export const PerSailorDay: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Per sailor-day" }));
    await expect(canvas.getByRole("columnheader", { name: "Per sailor-day" })).toBeVisible();
    // $5,760 of coach wages over 192 sailor-days.
    await expect(canvas.getByRole("row", { name: /^Coach wages\s*5000/ })).toHaveTextContent("$30.00");
  },
};

export const NoDays: Story = {
  args: { measures: { days: 0, sailor_days: 0 } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Per day" }));
    await expect(canvas.getAllByText("No days to divide by")[0]).toBeInTheDocument();
  },
};
