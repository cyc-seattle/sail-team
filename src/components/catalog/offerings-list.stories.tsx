import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { catalog } from "./fixtures";
import { OfferingsList } from "./offerings-list";

const meta = {
  component: OfferingsList,
  args: { offerings: catalog.offerings, products: catalog.products, today: "2026-11-21" },
} satisfies Meta<typeof OfferingsList>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Each program's offerings under it by the day they start, leaving out last summer's and a cancelled one. */
export const ByProgram: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas
        .getAllByRole("row")
        .map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent))
        .filter((cells) => cells.length > 0)
        .slice(0, 3),
    ).toEqual([
      ["Week 1", "Jun 21, 2027 to Jun 25, 2027", "$675", "12"],
      ["Week 2", "Jun 28, 2027 to Jul 2, 2027", "$675", "12"],
      ["Week 10", "Aug 23, 2027 to Aug 27, 2027", "$675", "12"],
    ]);
  },
};

export const Empty: Story = { args: { offerings: [] } };
