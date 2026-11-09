import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { budget, clubMembers, clubResults, twoCoaches } from "./fixtures";
import { FinancialPlanView } from "./financial-plan-view";

const meta = {
  component: FinancialPlanView,
  decorators: [
    withRouter("/plans/financial/budget", [
      "/plans/financial/$setId",
      "/plans/financial/$setId/$planId",
      "/plans/compare/$a/$b",
    ]),
  ],
  args: {
    set: budget,
    savedBy: "Pat Example",
    members: clubMembers,
    results: clubResults(),
  },
} satisfies Meta<typeof FinancialPlanView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Saved: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("table", { name: "Summary" })).toBeVisible();
  },
};

export const Draft: Story = {
  args: { set: twoCoaches, savedBy: null, results: clubResults(true) },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/Saved/)).toBeNull();
  },
};

export const ResultsNotIn: Story = { args: { results: null } };
