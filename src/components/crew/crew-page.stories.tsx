import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { CrewPage } from "./crew-page";

const meta = {
  component: CrewPage,
  decorators: [withRouter("/crew", ["/crew", "/crew/positions"])],
  parameters: { layout: "fullscreen" },
  args: { current: "members", children: <p>The page.</p> },
} satisfies Meta<typeof CrewPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const OnCrewMembers: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Crew members" })).toHaveAttribute("aria-current", "page");
  },
};
