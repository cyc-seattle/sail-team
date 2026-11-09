import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { OfferingAssumptionsTable, OperationsAssumptionsView } from "./assumptions";
import { operationsAssumptions, youthAssumptions } from "./fixtures";

const meta = {
  component: OfferingAssumptionsTable,
  args: { offerings: youthAssumptions.offerings },
} satisfies Meta<typeof OfferingAssumptionsTable>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Offerings: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("row", { name: /Beginner camp, week 2/ })).toHaveTextContent("8 of 12");
    await expect(canvas.getByRole("row", { name: /Race clinic/ })).toHaveTextContent("50%");
  },
};

export const OneProgram: Story = { args: { offerings: youthAssumptions.offerings.slice(0, 2) } };

export const Operations: Story = {
  render: () => <OperationsAssumptionsView assumptions={operationsAssumptions.operations!} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("row", { name: /Executive Director/ })).toHaveTextContent("$43.27");
    await expect(canvas.getByRole("row", { name: /Card fees/ })).toHaveTextContent("programs and charters");
    await expect(canvas.getByRole("row", { name: /Parent helper/ })).toHaveTextContent("Volunteer");
  },
};
