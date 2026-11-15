import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { StorageReport } from "./storage-report";

const meta = {
  component: StorageReport,
  args: {
    costs: [
      { payer: "Doublehanded", kind: "area", name: "Storage (dinghy float and dry storage, by area)", cents: 699_500 },
      { payer: "Summer", kind: "area", name: "Storage (dinghy float and dry storage, by area)", cents: 982_400 },
      { payer: "Shared (G&A)", kind: "shared", name: "Self storage facility", cents: 172_800 },
      { payer: "No program", kind: "unallocated", name: "Storage not allocated to programs", cents: 1_307_000 },
    ],
  },
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
