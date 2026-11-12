import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { doublehandedStatement, fundraising, summerStatement } from "./fixtures";
import { StatementTable } from "./statement-table";

const meta = {
  component: StatementTable,
  args: {
    label: "Revenue and expenses",
    sections: [
      { title: "Revenue", accounts: doublehandedStatement.revenue },
      { title: "Direct costs", accounts: doublehandedStatement.direct, leaves: "Gross" },
      { title: "Indirect costs", accounts: doublehandedStatement.indirect, leaves: "Net" },
    ],
  },
} satisfies Meta<typeof StatementTable>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Revenue, less direct costs, is the gross; less indirect costs, the net. */
export const ProgramArea: Story = {};

/** An account opens to the lines it adds up, each with how it was worked out. */
export const LinesOfAnAccount: Story = {
  args: {
    sections: [
      { title: "Revenue", accounts: summerStatement.revenue },
      { title: "Direct costs", accounts: summerStatement.direct, leaves: "Gross" },
      { title: "Indirect costs", accounts: summerStatement.indirect, leaves: "Net" },
    ],
  },
  play: async ({ canvas }) => {
    const wages = canvas.getByRole("button", { name: "Coach wages" });
    await userEvent.click(wages);
    await expect(wages).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText("Coach wages, 21 offerings")).toBeVisible();
    await expect(canvas.getByText("Staff × paid hours × each one's hourly rate")).toBeVisible();
  },
};

export const RevenueAndCosts: Story = {
  args: {
    label: "Fundraising",
    sections: [
      { title: "Revenue", accounts: fundraising.revenue },
      { title: "Costs", accounts: fundraising.costs, leaves: "Net" },
    ],
  },
};
