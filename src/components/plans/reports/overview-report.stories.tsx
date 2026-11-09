import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { withRouter } from "../../../../.storybook/with-router";
import { overviewRows } from "./fixtures";
import { OverviewReport } from "./overview-report";

const meta = {
  component: OverviewReport,
  decorators: [
    withRouter("/plans/financial/budget", ["/plans/financial/$setId", "/plans/financial/$setId/$planId", "/plans"]),
  ],
  args: { setId: "budget", rows: overviewRows },
} satisfies Meta<typeof OverviewReport>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Opens with the largest revenue first, and Non-program last. */
export const ByRevenue: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Revenue and expenses" });
    const rows = table.querySelectorAll("tbody tr");
    await expect(rows[0]).toHaveTextContent("Summer");
    await expect(rows[rows.length - 1]).toHaveTextContent("Non-program");
  },
};

/** Pressing Net sorts by it, largest first; pressing it again turns it around. */
export const ByNet: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Revenue and expenses" });
    await userEvent.click(canvas.getByRole("button", { name: "Net" }));
    await expect(canvas.getByRole("columnheader", { name: "Net" })).toHaveAttribute("aria-sort", "descending");
    await userEvent.click(canvas.getByRole("button", { name: "Net" }));
    await expect(canvas.getByRole("columnheader", { name: "Net" })).toHaveAttribute("aria-sort", "ascending");
    await expect(table.querySelector("tbody tr")).toHaveTextContent("High Performance");
  },
};
