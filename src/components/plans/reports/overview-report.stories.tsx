import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { withRouter } from "../../../../.storybook/with-router";
import { areaOfferings, functions, operationsNotes, overviewRows, totals, warnings } from "./fixtures";
import { OverviewReport } from "./overview-report";

const meta = {
  component: OverviewReport,
  decorators: [
    withRouter("/plans/financial/budget", ["/plans/financial/$setId", "/plans/financial/$setId/$planId", "/plans"]),
  ],
  args: {
    setId: "budget",
    note: "Reviewed with the board. From the [2027 workbook](https://example.com/workbook).",
    notes: operationsNotes,
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

/** Once Non-program carries no G&A, it has no Indirect costs column. */
export const NonProgramWithoutShares: Story = {
  args: {
    rows: overviewRows.map((r) => (r.report === "non-program" ? { ...r, indirect_cents: 0 } : r)),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("table", { name: "Non-program" })).not.toHaveTextContent("Indirect costs");
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

/** Each program area's budget, its programs under it, and what's charged to the area itself. */
export const Budget: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Budget" });
    await expect(within(table).getByRole("link", { name: "Summer" })).toBeVisible();
    await expect(table).toHaveTextContent("Guppies");
    await expect(table.querySelector("tfoot")).toHaveTextContent("All program areas");
  },
};

/** Enrollment, then fees, as a program area's report orders them, each by program. */
export const ByProgram: Story = {
  play: async ({ canvas }) => {
    const enrollment = canvas.getByRole("table", { name: "Enrollment" });
    const fees = canvas.getByRole("table", { name: "Fees" });
    await expect(enrollment.compareDocumentPosition(fees) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const table of [enrollment, fees]) {
      await expect(table).toHaveTextContent("Guppies");
      await expect(table).not.toHaveTextContent("Week 1");
    }
    await expect(fees.querySelector("tfoot")).toHaveTextContent("All programs");
  },
};

/** The plan's note, then the notes every program follows, closed at first. */
export const Notes: Story = {
  play: async ({ canvas }) => {
    const notes = canvas.getByText("Notes", { selector: "h2" });
    await expect(canvas.getByRole("link", { name: "2027 workbook" })).not.toBeVisible();
    await userEvent.click(notes);
    await expect(canvas.getByRole("link", { name: "2027 workbook" })).toBeVisible();
    await expect(canvas.getByRole("list", { name: "Notes" })).toBeVisible();
  },
};

/** A plan with no notes has no Notes. */
export const NoNotes: Story = {
  args: { note: null, notes: null },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText("Notes", { selector: "h2" })).toBeNull();
  },
};
