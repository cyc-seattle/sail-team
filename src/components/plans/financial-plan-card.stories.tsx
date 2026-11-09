import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { budget, threeCoaches, twoCoaches } from "./fixtures";
import { FinancialPlanCard } from "./financial-plan-card";

const meta = {
  component: FinancialPlanCard,
  decorators: [withRouter("/plans", ["/plans/financial/$setId"])],
  args: { plan: budget },
} satisfies Meta<typeof FinancialPlanCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Saved: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Reviewed with the board")).toBeVisible();
    await expect(canvas.getByText(/Saved March 10, 2027/)).toBeVisible();
  },
};

/** A draft shows its numbers as platform last worked them out, and links to the plan it started from. */
export const Draft: Story = {
  args: { plan: twoCoaches },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Budget" })).toBeVisible();
    await expect(canvas.getByText("Net")).toBeVisible();
  },
};

/** A draft whose numbers platform hasn't worked out yet. */
export const Calculating: Story = {
  args: { plan: threeCoaches },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Its numbers aren't worked out yet.")).toBeVisible();
  },
};
