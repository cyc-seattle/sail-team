import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { CompareView } from "./compare-view";
import { members, results, threeCoaches, twoCoaches } from "./fixtures";

const meta = {
  component: CompareView,
  args: {
    a: { set: twoCoaches, members, results: results(400_000, true) },
    b: { set: threeCoaches, members, results: results(200_000, true) },
  },
} satisfies Meta<typeof CompareView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TwoOptions: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("p")).toHaveTextContent(
      "Two coaches nets $2,000.00 more than Three coaches.",
    );
  },
};
