import type { Meta, StoryObj } from "@storybook/react-vite";
import { withRouter } from "../../../.storybook/with-router";
import { FinancialModelCard } from "./financial-model-card";

const meta = {
  component: FinancialModelCard,
  decorators: [withRouter("/plans", ["/plans/model/$setId"])],
  args: {
    year: 2027,
    plan: {
      id: "march",
      organization_id: "org",
      fiscal_year: 2027,
      name: "March",
      message: null,
      saved_at: "2027-03-10T18:00:00Z",
      totals: {
        calculated_at: "2027-03-10T18:00:00Z",
        operating_net_cents: 500_000,
        fundraising_net_cents: 120_000,
        capital_cents: 300_000,
        total_cents: 320_000,
      },
    },
  },
} satisfies Meta<typeof FinancialModelCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Saved: Story = {};

export const NoneYet: Story = { args: { plan: undefined } };
