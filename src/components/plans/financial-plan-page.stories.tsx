import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { budget, clubMembers, clubResults, twoCoaches } from "./fixtures";
import { FinancialPlanPage } from "./financial-plan-page";

const meta = {
  component: FinancialPlanPage,
  decorators: [
    withRouter("/plans/financial/budget", [
      "/plans/financial/$setId",
      "/plans/financial/$setId/$planId",
      "/plans/compare/$a/$b",
      "/plans",
    ]),
  ],
  parameters: { layout: "fullscreen" },
  args: {
    set: { ...budget, status: "active" },
    savedBy: "Pat Example",
    members: clubMembers,
    results: clubResults(),
    canUpdate: true,
    canCreate: true,
    onEdit: fn(async () => {}),
    onStart: fn(async () => {}),
    onMove: fn(async () => {}),
  },
} satisfies Meta<typeof FinancialPlanPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 1, name: "Budget" })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "Programs" })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "Non-program" })).toBeVisible();
  },
};

export const Draft: Story = {
  args: { set: twoCoaches, savedBy: null, results: clubResults(true) },
};

export const ReadOnly: Story = { args: { set: budget, canUpdate: false, canCreate: false } };
