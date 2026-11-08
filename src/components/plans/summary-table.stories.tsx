import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { summaryRows } from "@/model/financial-plans";
import { clubMembers, clubResults } from "./fixtures";
import { SummaryTable } from "./summary-table";

const meta = {
  component: SummaryTable,
  decorators: [
    withRouter("/plans/financial/budget", [
      "/plans/financial/$setId",
      "/plans/financial/$setId/$planId",
      "/plans/compare/$a/$b",
      "/plans",
    ]),
  ],
  args: { setId: "budget", ...summaryRows(clubMembers, clubResults()) },
} satisfies Meta<typeof SummaryTable>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Year: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Operations" })).toBeVisible();
    await expect(canvas.getByRole("columnheader", { name: "Gross" })).toBeVisible();
    await expect(canvas.getByRole("row", { name: /^Total/ })).toBeVisible();
  },
};
