import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../../.storybook/with-router";
import { reports } from "./fixtures";
import { ReportNav } from "./report-nav";

const meta = {
  component: ReportNav,
  decorators: [
    withRouter("/plans/financial/budget", ["/plans/financial/$setId", "/plans/financial/$setId/$planId", "/plans"]),
  ],
  args: { setId: "budget", reports, current: "summer" },
} satisfies Meta<typeof ReportNav>;
export default meta;
type Story = StoryObj<typeof meta>;

export const OnSummer: Story = {};

export const OnAPhone: Story = {
  globals: { viewport: { value: "phone" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("combobox", { name: "Report" })).toHaveTextContent("Summer");
  },
};
