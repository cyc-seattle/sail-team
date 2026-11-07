import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { FinancialModelView } from "./financial-model-view";
import { offerings, warnings } from "./fixtures";

const row = (member: string, name: string, pnl: (typeof offerings)[number]["pnl"]) => ({
  ...pnl,
  subject_key: pnl.key,
  name,
  version_set_member_id: member,
});

const meta = {
  component: FinancialModelView,
  args: {
    savedAt: "2027-03-10T18:00:00Z",
    totals: {
      calculated_at: "2027-03-10T18:00:00Z",
      operating_net_cents: 500_000,
      fundraising_net_cents: 120_000,
      capital_cents: 300_000,
      total_cents: 320_000,
    },
    members: [
      {
        id: "y",
        plan_id: "yp",
        version_id: "yv",
        plan_name: "Youth Racing 2027",
        kind: "program_area",
        program_area_id: "youth",
        area_name: "Youth Racing",
      },
      {
        id: "a",
        plan_id: "ap",
        version_id: "av",
        plan_name: "Adult Programs 2027",
        kind: "program_area",
        program_area_id: "adult",
        area_name: "Adult Programs",
      },
      {
        id: "o",
        plan_id: "op",
        version_id: "ov",
        plan_name: "Operations 2027",
        kind: "operations",
        program_area_id: null,
        area_name: null,
      },
    ],
    pnl: [
      row("y", offerings[0]!.name, offerings[0]!.pnl),
      row("y", offerings[1]!.name, offerings[1]!.pnl),
      row("a", offerings[2]!.name, offerings[2]!.pnl),
    ],
    lines: [
      {
        name: "Office rent",
        cost_center_name: "The club",
        amount_cents: 200_000,
        revenue: false,
        version_set_member_id: "o",
      },
      {
        name: "Donations",
        cost_center_name: "The club",
        amount_cents: 150_000,
        revenue: true,
        version_set_member_id: "o",
      },
    ],
    warnings: warnings.slice(0, 1),
  },
} satisfies Meta<typeof FinancialModelView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Saved: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/saved with, on March 10, 2027/)).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "Adult Programs" })).toBeVisible();
    await expect(canvas.getByRole("row", { name: /Office rent/ })).toHaveTextContent("−$2,000.00");
  },
};

export const NoOperationsLines: Story = { args: { lines: [], warnings: [] } };
