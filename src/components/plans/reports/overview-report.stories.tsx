import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { withRouter } from "../../../../.storybook/with-router";
import { areaOfferings, functions, overviewRows, totals, warnings } from "./fixtures";
import { OverviewReport } from "./overview-report";

const meta = {
  component: OverviewReport,
  decorators: [
    withRouter("/plans/financial/budget", ["/plans/financial/$setId", "/plans/financial/$setId/$planId", "/plans"]),
  ],
  args: {
    setId: "budget",
    rows: overviewRows,
    offerings: areaOfferings,
    warnings,
    totals,
    functions,
  },
} satisfies Meta<typeof OverviewReport>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Opens with the largest revenue first. Non-program has its own section, out of the program areas' table. */
export const ByRevenue: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Revenue and expenses" });
    const rows = table.querySelectorAll("tbody tr");
    await expect(rows[0]).toHaveTextContent("Summer");
    await expect(table).not.toHaveTextContent("Non-program");
    await expect(table.querySelector("tfoot")).toHaveTextContent("All program areas");
    await expect(canvas.getByRole("table", { name: "Non-program" })).toHaveTextContent("Indirect costs");
  },
};

/** Once Non-program carries no G&A, its net reduces G&A instead. */
export const NonProgramReducesGA: Story = {
  args: {
    rows: overviewRows.map((r) => (r.report === "non-program" ? { ...r, indirect_cents: 0 } : r)),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("table", { name: "Non-program" })).not.toHaveTextContent("Indirect costs");
    await expect(canvas.getByText(/Reduces G&A by/)).toBeVisible();
  },
};

/** Pressing Net sorts by it, largest first; pressing it again turns it around. */
export const ByNet: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Revenue and expenses" });
    const head = within(table).getByRole("columnheader", { name: "Net" });
    await userEvent.click(within(table).getByRole("button", { name: "Net" }));
    await expect(head).toHaveAttribute("aria-sort", "descending");
    await userEvent.click(within(table).getByRole("button", { name: "Net" }));
    await expect(head).toHaveAttribute("aria-sort", "ascending");
    await expect(table.querySelector("tbody tr")).toHaveTextContent("High Performance");
  },
};

/** The year's expenses by function, as on Form 990, and its operating net, with fundraising, less capital. */
export const Year: Story = {
  play: async ({ canvas }) => {
    const split = canvas.getByRole("table", { name: "Expenses by function" });
    await expect(split).toHaveTextContent("Management and general");
    await expect(split.querySelector("tfoot")).toHaveTextContent("100%");
    const table = canvas.getByRole("table", { name: "Year" });
    await expect(table).toHaveTextContent("Fundraising net");
    await expect(table).toHaveTextContent("Capital");
    await expect(table.querySelector("tfoot")).toHaveTextContent("Total");
  },
};

/** Fees and enrollment open by season, and the switch at the top groups both by program instead. */
export const ByProgram: Story = {
  play: async ({ canvas }) => {
    const enrollment = canvas.getByRole("table", { name: "Enrollment" });
    const fees = canvas.getByRole("table", { name: "Program fees" });
    await expect(enrollment).toHaveTextContent("Week 1");
    await expect(fees).toHaveTextContent("Week 1");
    await userEvent.click(canvas.getByRole("button", { name: "By program" }));
    for (const table of [enrollment, fees]) {
      await expect(table).toHaveTextContent("Guppies");
      await expect(table).not.toHaveTextContent("Week 1");
    }
    await expect(fees.querySelector("tfoot")).toHaveTextContent("All programs");
  },
};

/** A plan with nothing to warn about has no warnings card. */
export const NoWarnings: Story = { args: { warnings: [] } };
