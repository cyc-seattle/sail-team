import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { doublehanded } from "./fixtures";
import { TeamRosterView } from "./team-roster";

const meta = {
  component: TeamRosterView,
  args: { team: doublehanded, by: "division", onByChange: fn() },
} satisfies Meta<typeof TeamRosterView>;
export default meta;
type Story = StoryObj<typeof meta>;

// Kai is on both pods, so counts once in the team's total.
export const ByDivision: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText("5 sailors in all")).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "J-Pod 3 sailors" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "j-pod@example.org" })).toHaveAttribute(
      "href",
      "https://groups.google.com/a/example.org/g/j-pod",
    );
    await userEvent.click(canvas.getByRole("button", { name: "By school" }));
    await expect(args.onByChange).toHaveBeenCalledWith("school");
  },
};

export const BySchool: Story = {
  args: { by: "school" },
  play: async ({ canvas }) => {
    const headings = canvas.getAllByRole("heading").map((h) => h.textContent);
    await expect(headings).toEqual([
      "Harbor View Middle School1 sailor",
      "Lakeside Middle School2 sailors",
      "School not on file2 sailors",
    ]);
  },
};
