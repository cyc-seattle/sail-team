import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ThemeMenuItems } from "./theme-menu-items";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu";

const meta = { component: ThemeMenuItems } satisfies Meta<typeof ThemeMenuItems>;
export default meta;
type Story = StoryObj<typeof meta>;

export const InTheUserMenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>You</DropdownMenuTrigger>
      <DropdownMenuContent>
        <ThemeMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "You" }));
    const menu = await within(canvasElement.ownerDocument.body).findByRole("menu");
    await expect(within(menu).getByRole("menuitemradio", { name: "Same as this device" })).toBeChecked();
  },
};
