import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { AccountsList } from "./accounts-list";
import { catalog } from "./fixtures";

const meta = {
  component: AccountsList,
  args: { accounts: catalog.accounts, costAccounts: catalog.costAccounts },
} satisfies Meta<typeof AccountsList>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The chart by type, in number order, without retired accounts, and where each cost is booked. */
export const Chart: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByText("Launch fuel")).not.toBeInTheDocument();
    await expect(canvas.getByRole("table", { name: "Where costs are booked" })).toHaveTextContent("Boat upkeep");
  },
};

/** Show retired adds them, muted. */
export const ShowRetired: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("switch", { name: "Show retired" }));
    await expect(canvas.getByText("Launch fuel")).toBeVisible();
  },
};

export const OnAPhone: Story = { globals: { viewport: { value: "phone" } } };
