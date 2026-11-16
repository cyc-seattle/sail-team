import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import { warnings } from "./fixtures";
import { WarningsSection } from "./warnings-section";

const meta = {
  component: WarningsSection,
  args: { warnings: warnings.filter((w) => w.area === "summer"), onDay: fn() },
} satisfies Meta<typeof WarningsSection>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A program area's warnings, errors first, then by date. Each date opens that day on the calendar. */
export const ProgramArea: Story = {
  play: async ({ canvas, args }) => {
    const rows = canvas.getByRole("table", { name: "Warnings" }).querySelectorAll("tbody tr");
    await expect(rows[0]).toHaveTextContent("Too few boats");
    await expect(rows[0]).toHaveTextContent("Error");
    await userEvent.click(canvas.getByRole("button", { name: "Mon, Jul 5" }));
    await expect(args.onDay).toHaveBeenCalledWith("2027-07-05");
  },
};

/** The Overview's, about no program area, with no calendar to open. */
export const Overview: Story = {
  render: () => <WarningsSection warnings={warnings.filter((w) => w.area === "non-program")} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("table", { name: "Warnings" })).toHaveTextContent("Capital not ranked");
  },
};
