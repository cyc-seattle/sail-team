import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { withRouter } from "../../../../.storybook/with-router";
import { planningPlans } from "./fixtures";
import { PlanningPage } from "./planning-page";

const meta = {
  component: PlanningPage,
  decorators: [withRouter("/plans", ["/plans", "/plans/financial/$setId", "/plans/compare/$a/$b"])],
  parameters: { layout: "fullscreen" },
  args: { plans: planningPlans },
} satisfies Meta<typeof PlanningPage>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The planning agent's draft sits with the others, marked as the agent's, with its report as the note. */
export const WithAgentDraft: Story = {};

/** Deleting a draft asks first. */
export const DeletingTheAgentsDraft: Story = {
  play: async ({ canvas }) => {
    const draft = canvas.getByRole("article", { name: "2027 allocations, Nov 9" });
    await userEvent.click(within(draft).getByRole("button", { name: "Delete" }));
    await waitFor(async () => expect(await screen.findByText("Delete 2027 allocations, Nov 9?")).toBeVisible());
  },
};
