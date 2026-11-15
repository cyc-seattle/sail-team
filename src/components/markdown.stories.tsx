import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { InlineMarkdown } from "./markdown";

const meta = {
  component: InlineMarkdown,
  args: { children: "From the [board's budget spreadsheet](https://example.com/budget), with **two** coaches" },
  decorators: [(Story) => <p className="p-card text-sm">{Story()}</p>],
} satisfies Meta<typeof InlineMarkdown>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A note's link and bold. */
export const Note: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "board's budget spreadsheet" })).toHaveAttribute(
      "href",
      "https://example.com/budget",
    );
    await expect(canvas.getByText("two").tagName).toBe("STRONG");
  },
};

/** A heading, a list, or raw HTML in a note shows as its text, inline. */
export const OnlyInline: Story = {
  args: { children: "# Budget\n\n- Two coaches <script>alert(1)</script>" },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("heading")).toBeNull();
    await expect(canvas.queryByRole("list")).toBeNull();
    await expect(canvas.getByText(/Budget/)).toBeVisible();
  },
};
