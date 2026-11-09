import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { withUnitSwitch } from "../../../.storybook/with-unit-switch";
import { clubMembers, clubResults } from "./fixtures";
import { ProgramsSection } from "./programs-section";

const meta = {
  component: ProgramsSection,
  decorators: [
    withUnitSwitch,
    withRouter("/plans/financial/budget", [
      "/plans/financial/$setId",
      "/plans/financial/$setId/$planId",
      "/plans/compare/$a/$b",
      "/plans",
    ]),
  ],
  args: { setId: "budget", members: clubMembers, results: clubResults() },
} satisfies Meta<typeof ProgramsSection>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeAreas: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Doublehanded" })).toBeVisible();
    await expect(canvas.getByRole("cell", { name: "J-Pod · fall practices" })).toBeVisible();
  },
};

// J-Pod nets $3,000 over 312 sailor-days.
export const PerSailorDay: Story = {
  play: async ({ canvas, userEvent }) => {
    const row = canvas.getByRole("row", { name: /J-Pod · fall practices/ });
    await expect(row).toHaveTextContent("$3,000");
    await userEvent.click(canvas.getByRole("button", { name: "Per sailor-day" }));
    await expect(row).toHaveTextContent("$9.62");
  },
};

export const NoPrograms: Story = { args: { members: clubMembers.filter((m) => m.kind === "operations") } };
