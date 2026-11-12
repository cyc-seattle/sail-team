import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { AccountTable } from "./account-table";
import { Money } from "./money";

const amount = (cents: number) => [<Money key="amount" cents={cents} whole />];

const meta = {
  component: AccountTable,
  args: {
    label: "Fixed costs and G&A",
    nameHead: "Cost",
    columns: [{ head: "Amount" }, { head: "Left out of MTDC", text: true }],
    groups: [
      {
        title: "G&A",
        rows: [
          {
            key: "insurance",
            number: "6110",
            name: "Insurance",
            note: "Renews in March.",
            values: [...amount(900_000), "—"],
          },
          {
            key: "rent",
            number: "6310",
            name: "Clubhouse fee",
            values: [...amount(1_200_000), "Yes"],
          },
        ],
      },
      {
        title: "Space",
        rows: [{ key: "floats", number: "6320", name: "Dinghy floats", values: [...amount(800_000), "—"] }],
        footers: [{ name: "Total", values: [...amount(2_900_000), null] }],
      },
    ],
  },
} satisfies Meta<typeof AccountTable>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Account first, then the name with its note behind an info icon, then its values. */
export const FixedCosts: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Note" })).toBeVisible();
  },
};

/** An account opens to its lines, each with how it was worked out; one without lines doesn't open. */
export const Lines: Story = {
  args: {
    label: "Costs",
    columns: [{ head: "Amount" }],
    groups: [
      {
        rows: [
          {
            key: "wages",
            number: "5010",
            name: "Coach wages",
            values: amount(7_400_000),
            lines: [
              { key: "a", name: "Coach wages, 21 offerings", detail: "Staff × paid hours", values: amount(7_000_000) },
              { key: "b", name: "Trip wages", detail: null, values: amount(400_000) },
            ],
          },
          {
            key: "events",
            number: "7010",
            name: "Event costs",
            values: amount(900_000),
          },
        ],
      },
    ],
  },
  play: async ({ canvas }) => {
    const wages = canvas.getByRole("button", { name: "Coach wages" });
    await userEvent.click(wages);
    await expect(wages).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText("Staff × paid hours")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Event costs" })).toBeNull();
  },
};
