import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { catalog } from "./fixtures";
import { ProductsList } from "./products-list";

const meta = {
  component: ProductsList,
  args: { areas: catalog.areas, products: catalog.products, accounts: catalog.accounts },
} satisfies Meta<typeof ProductsList>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Products under their program area with its revenue account, then those in none with their own. */
export const ByArea: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("rowheader").map((th) => th.textContent)).toEqual([
      "Doublehanded",
      "Summer",
      "No program area",
    ]);
    await expect(canvas.getByRole("link", { name: "jpod@example.org" })).toHaveAttribute(
      "href",
      "https://groups.google.com/a/example.org/g/jpod",
    );
  },
};

export const OnAPhone: Story = { globals: { viewport: { value: "phone" } } };

export const Empty: Story = { args: { products: [] } };
