import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { storageCosts } from "./fixtures";
import { StorageReport } from "./storage-report";

const meta = {
  component: StorageReport,
  args: { costs: storageCosts },
} satisfies Meta<typeof StorageReport>;
export default meta;
type Story = StoryObj<typeof meta>;

/** What each area pays, what every program shares, and what no program pays, with the total. */
export const Storage: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("row", { name: /Total/ })).toHaveTextContent("$31,617");
  },
};

/** A plan with nothing on the Storage account says so. */
export const NoStorage: Story = {
  args: { costs: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/no storage costs/)).toBeVisible();
  },
};
