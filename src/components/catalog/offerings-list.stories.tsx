import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { catalog } from "./fixtures";
import { OfferingsList } from "./offerings-list";

const meta = {
  component: OfferingsList,
  args: { offerings: catalog.offerings, products: catalog.products },
} satisfies Meta<typeof OfferingsList>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Each program's offerings under it, with week 2 before week 10. */
export const ByProgram: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas
        .getAllByRole("cell")
        .map((td) => td.textContent)
        .slice(0, 3),
    ).toEqual(["week 1", "week 2", "week 10"]);
  },
};

export const Empty: Story = { args: { offerings: [] } };
