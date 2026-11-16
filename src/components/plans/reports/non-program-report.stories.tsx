import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { capital, fundraising, products, sharedCosts } from "./fixtures";
import { NonProgramReport } from "./non-program-report";

const meta = {
  component: NonProgramReport,
  args: { products, shared: sharedCosts, fundraising, capital },
} satisfies Meta<typeof NonProgramReport>;
export default meta;
type Story = StoryObj<typeof meta>;

/** What's sold outside the programs, with no title of its own, then shared costs, fundraising, and capital. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("table", { name: "Sold outside programs" })).toBeVisible();
    await expect(canvas.queryByRole("heading", { name: "Sold outside programs" })).toBeNull();
    for (const name of ["Shared costs", "Fundraising", "Capital"]) {
      await expect(canvas.getByRole("heading", { name })).toBeVisible();
    }
  },
};
