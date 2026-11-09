import type { Meta, StoryObj } from "@storybook/react-vite";
import { doublehandedStatement, fundraising } from "./fixtures";
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

export const RevenueAndCosts: Story = {
  args: {
    label: "Fundraising",
    sections: [
      { title: "Revenue", accounts: fundraising.revenue },
      { title: "Costs", accounts: fundraising.costs, leaves: "Net" },
    ],
  },
};
