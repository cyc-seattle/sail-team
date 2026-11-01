import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./table";

const rows = [
  { account: "Tuition", amount: "$12,400.00" },
  { account: "Instructor pay", amount: "−$7,850.00" },
  { account: "Boat upkeep", amount: "−$1,200.00" },
];

const meta = { component: Table } satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;

// Numbers are right-aligned in tabular figures, with the total in the footer.
export const WithTotal: Story = {
  render: () => (
    <Table>
      <TableCaption>A made-up summer camp</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Account</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.account}>
            <TableCell>{row.account}</TableCell>
            <TableCell className="text-right tabular-nums">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Net</TableCell>
          <TableCell className="text-right tabular-nums">$3,350.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};
