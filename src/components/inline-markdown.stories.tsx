import type { Meta, StoryObj } from "@storybook/react-vite";
import { InlineMarkdown } from "./inline-markdown";

const meta = {
  component: InlineMarkdown,
  args: {
    text: "Two **head instructors** on *race days*, per [the coaching guide](https://example.org) and `level 3`.",
  },
} satisfies Meta<typeof InlineMarkdown>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Styled: Story = {};

export const BlockMarkdownAsText: Story = { args: { text: "# Not a heading\n\n- not a list" } };
