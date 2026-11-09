import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import { withRouter } from "../../../../.storybook/with-router";
import { planningPlans } from "./fixtures";
import { PlanningPage } from "./planning-page";

const meta = {
  component: PlanningPage,
  decorators: [withRouter("/plans", ["/plans", "/plans/financial/$setId"])],
  parameters: { layout: "fullscreen" },
  args: { plans: planningPlans },
} satisfies Meta<typeof PlanningPage>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Opens on the newest year. The planning agent's draft is a draft like any other, with its report as its note. */
export const NewestYear: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("link", { name: "2026 Budget" })).toBeNull();
  },
};

/** Every year's plans, narrowed to drafts. */
export const Drafts: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Status" }));
    await userEvent.click(await screen.findByRole("option", { name: "Draft" }));
    await waitFor(() => expect(canvas.queryByText("Active")).toBeNull());
    await expect(canvas.getByRole("link", { name: "Two more coaches" })).toBeVisible();
  },
};

/** Deleting a draft asks first. */
export const DeletingTheAgentsDraft: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Delete 2027 allocations, Nov 9" }));
    await waitFor(async () => expect(await screen.findByText("Delete 2027 allocations, Nov 9?")).toBeVisible());
  },
};
