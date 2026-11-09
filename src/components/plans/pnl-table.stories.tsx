import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withUnitSwitch } from "../../../.storybook/with-unit-switch";
import { offering, offerings } from "./fixtures";
import { PnlTable } from "./pnl-table";

const meta = {
  component: PnlTable,
  args: { rows: offerings, label: "Offering" },
  decorators: [withUnitSwitch],
} satisfies Meta<typeof PnlTable>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ForTheYear: Story = {};

// The scenario in features/plans.feature: $4,000 net over 10 days, for 10 sailors.
export const PerSailorDay: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Per sailor-day" }));
    const row = canvas.getByRole("row", { name: /Beginner camp, week 1/ });
    await expect(row).toHaveTextContent("$40.00");
  },
};

export const ByProgram: Story = {
  args: {
    groups: [
      { name: "Beginner camp", rows: offerings.slice(0, 2) },
      { name: "Race team", rows: offerings.slice(2) },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("row", { name: /Beginner camp total/ })).toHaveTextContent("$18,000");
  },
};

export const OneOffering: Story = { args: { rows: offerings.slice(0, 1) } };

export const NoDays: Story = {
  args: { rows: [{ name: "Merchandise", pnl: offering("merch", 50_000, 30_000, 0, 0) }], label: "Product" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Per day" }));
    await expect(canvas.getByText("No days to divide by")).toBeVisible();
  },
};
