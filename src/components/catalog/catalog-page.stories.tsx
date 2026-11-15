import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { CatalogPage } from "./catalog-page";

const meta = {
  component: CatalogPage,
  decorators: [
    withRouter("/catalog", ["/catalog", "/catalog/offerings", "/catalog/accounts", "/catalog/qualifications"]),
  ],
  parameters: { layout: "fullscreen" },
  args: { current: "products", children: <p>The page.</p> },
} satisfies Meta<typeof CatalogPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const OnProducts: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Products" })).toHaveAttribute("aria-current", "page");
  },
};

export const OnAPhone: Story = {
  args: { current: "accounts" },
  globals: { viewport: { value: "phone" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("combobox", { name: "Catalog page" })).toHaveTextContent("Accounts");
  },
};
