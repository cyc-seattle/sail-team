import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { budget, members, results, threeCoaches, twoCoaches } from "./fixtures";
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
    members,
    results: results(500_000),
    others: [twoCoaches, threeCoaches],
  },
} satisfies Meta<typeof FinancialPlanView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Saved: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Operations Plan")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Three coaches" })).toBeVisible();
  },
};

export const Draft: Story = {
  args: { set: twoCoaches, savedBy: null, results: results(700_000, true), others: [budget] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/calculated now/)).toBeVisible();
  },
};

export const ResultsNotIn: Story = { args: { results: null } };
