import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { budget, threeCoaches, twoCoaches } from "./fixtures";
import { FinancialPlanList } from "./financial-plan-list";

const meta = {
  component: FinancialPlanList,
  decorators: [withRouter("/plans", ["/plans/financial/$setId"])],
  args: { plans: [budget, twoCoaches, threeCoaches] },
} satisfies Meta<typeof FinancialPlanList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ByYear: Story = {
  play: async ({ canvas }) => {
    const names = canvas.getAllByRole("article").map((card) => card.getAttribute("aria-labelledby"));
    await expect(names).toEqual(["plan-three", "plan-two", "plan-budget"]);
  },
};

export const NoneYet: Story = { args: { plans: [] } };
