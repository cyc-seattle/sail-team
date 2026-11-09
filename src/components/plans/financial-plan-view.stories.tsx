import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { budget, clubMembers, clubResults, threeCoaches, twoCoaches } from "./fixtures";
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

/** A draft whose numbers platform is still working out, such as one just changed or saved. */
export const Calculating: Story = {
  args: { set: threeCoaches, savedBy: null, results: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status")).toHaveTextContent("Working out its numbers");
  },
};

/** A draft whose numbers are still missing after a while: the engine couldn't work them out. */
export const CouldNotWorkOut: Story = {
  args: { set: threeCoaches, savedBy: null, results: null, stuck: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/couldn't be worked out/)).toBeVisible();
  },
};
