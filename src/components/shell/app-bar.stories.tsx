import type { Meta, StoryObj } from "@storybook/react-vite";
import { withRouter } from "../../../.storybook/with-router";
import { expect, waitFor, within } from "storybook/test";
import { AppBar } from "./app-bar";

const meta = {
  component: AppBar,
  decorators: [withRouter("/plans", ["/", "/roster"])],
  parameters: { layout: "fullscreen" },
  args: {
    name: "Robin Tiller",
    nav: [
      { to: "/plans", label: "Plans" },
      { to: "/roster", label: "Rosters" },
    ],
  },
} satisfies Meta<typeof AppBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("link", { name: "Plans" })).toHaveAttribute("data-status", "active");
  },
};

export const NoSections: Story = { args: { nav: [] } };

export const UserMenuOpen: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Robin Tiller" }));
    const menu = within(canvasElement.ownerDocument.body);
    await waitFor(async () => expect(await menu.findByText("Signed in as Robin Tiller")).toBeVisible());
  },
};
