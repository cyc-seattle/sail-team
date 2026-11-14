import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { OperationsAssumptionsView } from "./assumptions";
import { reportAssumptions } from "./reports/fixtures";

const meta = {
  component: OperationsAssumptionsView,
  args: { assumptions: reportAssumptions },
} satisfies Meta<typeof OperationsAssumptionsView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Operations: Story = {
  play: async ({ canvas }) => {
    await userEvent.hover(
      within(canvas.getByRole("row", { name: /Executive Director/ })).getByRole("button", { name: "Per hour" }),
    );
    await waitFor(async () => expect(await screen.findByText("$43.27 an hour, over 2,080 paid hours")).toBeVisible());
    await expect(canvas.getByRole("row", { name: /Card fees/ })).toHaveTextContent("programs and charters");
    await expect(canvas.getByRole("row", { name: /Parent helper/ })).toHaveTextContent("Volunteer");
    // Its max capacity, then its upkeep: how many boats CSC has is platform's asset list, not the plan's.
    await expect(canvas.getByRole("row", { name: /Sailqube/ })).toHaveTextContent(/^Sailqube2\$2\.00$/);
  },
};

/** A position's bonus shows its share of net, and its role and basis on hover or a tap. */
export const Bonus: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "10%" }));
    await waitFor(async () =>
      expect(await screen.findByText("Program Director: 10% of net, after shared costs")).toBeVisible(),
    );
  },
};

/** Every bonus, by account, with the products it's on and the position it pays, if any. */
export const Bonuses: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Bonuses" });
    await expect(within(table).getByRole("row", { name: /Summer Director/ })).toHaveTextContent(
      "5030Summer Director5%Before shared costsGuppies, Opti Camp—",
    );
  },
};

/** Fixed costs under what they're charged to, and the other inputs with no rate of their own. */
export const CostsAndDays: Story = {
  play: async ({ canvas }) => {
    const costs = canvas.getByRole("table", { name: "Fixed costs and G&A" });
    await expect(within(costs).getByRole("row", { name: /Audit/ })).toHaveTextContent("Yes");
    await expect(costs).toHaveTextContent("Program admin");
    await expect(costs).not.toHaveTextContent("Spring gala gifts");
    await expect(canvas.getByRole("table", { name: "Other revenue" })).toHaveTextContent("Spring gala gifts");
    await expect(canvas.getByRole("row", { name: /Winter boat repairs/ })).toHaveTextContent("120");
    await expect(canvas.getByRole("row", { name: /Labor Day/ })).toHaveTextContent("Sep 6, 2027");
    const hours = canvas.getByRole("table", { name: "Salaried hours on programs" });
    await expect(within(hours).getByRole("row", { name: /J-Pod/ })).toHaveTextContent("120.5");
    await expect(canvas.getByRole("row", { name: /Program Director.*\$65,000/ })).toHaveTextContent("Program admin");
  },
};
