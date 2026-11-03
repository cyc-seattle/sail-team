import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { ClubMovedOn } from "./club-moved-on";

const meta = {
  component: ClubMovedOn,
  decorators: [withRouter("/plans/club/march", ["/plans/club/$setId/now"])],
  args: { setId: "march", moved: ["Youth Racing"] },
} satisfies Meta<typeof ClubMovedOn>;
export default meta;
type Story = StoryObj<typeof meta>;

export const OneArea: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Youth Racing has moved on/)).toBeVisible();
    await expect(canvas.getByRole("link", { name: "See the club's plan as it stands now" })).toHaveAttribute(
      "href",
      "/plans/club/march/now",
    );
  },
};

export const Several: Story = {
  args: { moved: ["the Operations Plan", "Youth Racing", "Adult Programs"] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/the Operations Plan, Youth Racing, and Adult Programs have moved on/)).toBeVisible();
  },
};

// Shows nothing while the club plan is still the club's plan.
export const NotMovedOn: Story = { args: { moved: [] } };
