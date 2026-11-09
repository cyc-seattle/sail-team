import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { withRouter } from "../../../../.storybook/with-router";
import { warnings } from "./fixtures";
import { WarningsSection } from "./warnings-section";

const meta = {
  component: WarningsSection,
  decorators: [withRouter("/plans/financial/budget", ["/plans/financial/$setId", "/plans/financial/$setId/$planId"])],
  args: { warnings: warnings.filter((w) => w.area === "summer") },
} satisfies Meta<typeof WarningsSection>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A program area's own warnings, by date. */
export const ProgramArea: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("3 warnings", { selector: "h2" }));
    await expect(canvas.getByRole("list", { name: "Warnings" })).toBeVisible();
  },
};

/** On the Overview, each warning names its program area. */
export const Overview: Story = {
  args: { warnings, setId: "budget", areas: { summer: "Summer", doublehanded: "Doublehanded" } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("4 warnings", { selector: "h2" }));
    await expect(canvas.getByRole("link", { name: "Doublehanded" })).toBeVisible();
  },
};
