import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { ModelMovedOn } from "./model-moved-on";

const meta = {
  component: ModelMovedOn,
  decorators: [withRouter("/plans/model/march", ["/plans/model/$setId/now"])],
  args: { setId: "march", moved: ["Youth Racing"] },
} satisfies Meta<typeof ModelMovedOn>;
export default meta;
type Story = StoryObj<typeof meta>;

export const OneArea: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Youth Racing has moved on/)).toBeVisible();
    await expect(canvas.getByRole("link", { name: "See the financial model as it stands now" })).toHaveAttribute(
      "href",
      "/plans/model/march/now",
    );
  },
};

export const Several: Story = {
  args: { moved: ["the Operations Plan", "Youth Racing", "Adult Programs"] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/the Operations Plan, Youth Racing, and Adult Programs have moved on/)).toBeVisible();
  },
};

// Shows nothing while every plan still has the version the financial model holds.
export const NotMovedOn: Story = { args: { moved: [] } };
