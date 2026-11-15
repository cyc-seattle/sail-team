import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { InventoryPage } from "./inventory-page";

const meta = {
  component: InventoryPage,
  decorators: [withRouter("/inventory", ["/inventory", "/inventory/classes", "/inventory/storage"])],
  parameters: { layout: "fullscreen" },
  args: { current: "assets", children: <p>The page.</p> },
} satisfies Meta<typeof InventoryPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const OnAssets: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Assets" })).toHaveAttribute("aria-current", "page");
  },
};

export const OnAPhone: Story = {
  args: { current: "storage" },
  globals: { viewport: { value: "phone" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("combobox", { name: "Inventory page" })).toHaveTextContent("Storage");
  },
};
