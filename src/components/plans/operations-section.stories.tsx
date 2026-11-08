import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { clubMembers, clubResults } from "./fixtures";
import { OperationsSection } from "./operations-section";

const meta = {
  component: OperationsSection,
  decorators: [
    withRouter("/plans/financial/budget", [
      "/plans/financial/$setId",
      "/plans/financial/$setId/$planId",
      "/plans/compare/$a/$b",
      "/plans",
    ]),
  ],
  args: { setId: "budget", operations: clubMembers.find((m) => m.kind === "operations"), results: clubResults() },
} satisfies Meta<typeof OperationsSection>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SalesFundraisingAndCapital: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("row", { name: /^Boat storage/ })).toBeVisible();
    await expect(canvas.getByRole("row", { name: /^Fundraising \$9,000 \$2,100 \$6,900/ })).toBeVisible();
    await expect(canvas.getByRole("row", { name: /^Capital/ })).toHaveTextContent("$6,500");
  },
};
