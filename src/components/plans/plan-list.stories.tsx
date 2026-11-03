import type { Meta, StoryObj } from "@storybook/react-vite";
import { withRouter } from "../../../.storybook/with-router";
import type { PlanSummary } from "@/directus/plans";
import { PlanList } from "./plan-list";

const plan = (id: string, year: number, name: string, area: string | null): PlanSummary => ({
  id,
  name,
  kind: area ? "program_area" : "operations",
  fiscal_year: year,
  organization_id: "org",
  program_area_id: area && `${area}-id`,
  area_name: area,
});

const meta = {
  component: PlanList,
  decorators: [withRouter("/plans", ["/plans/$planId", "/plans/club/$setId"])],
  args: {
    plans: [
      plan("a", 2027, "Youth Racing 2027", "Youth Racing"),
      plan("b", 2027, "Adult Learn to Sail 2027", "Adult Programs"),
      plan("c", 2027, "Operations 2027", null),
      plan("d", 2026, "Youth Racing 2026", "Youth Racing"),
    ],
  },
} satisfies Meta<typeof PlanList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ByYear: Story = {};

export const NoPlans: Story = { args: { plans: [] } };
