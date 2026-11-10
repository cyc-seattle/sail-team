import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor } from "storybook/test";
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
    await expect(canvas.getByRole("row", { name: /Executive Director/ })).toHaveTextContent("$43.27");
    await expect(canvas.getByRole("row", { name: /Card fees/ })).toHaveTextContent("programs and charters");
    await expect(canvas.getByRole("row", { name: /Parent helper/ })).toHaveTextContent("Volunteer");
    await expect(canvas.getByRole("row", { name: /Sailqube/ })).toHaveTextContent("12");
  },
};

/** A position's bonus shows its share of net, and its role and basis on hover or a tap. */
export const Bonus: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "10%" }));
    await waitFor(async () =>
      expect(await screen.findByText("Program Director: 10% of net, after shared costs")).toBeVisible(),
    );
    await expect(
      canvas.getByText(/Summer Director: 5% of net, before shared costs, paying no salaried position/),
    ).toBeVisible();
  },
};

export const SideBySide: Story = { args: { stacked: false } };
