import type { Meta, StoryObj } from "@storybook/react-vite";
import { summerRules } from "./fixtures";
import { RulesList } from "./rules-list";

const meta = { component: RulesList, args: { rules: summerRules, label: "Summer rules" } } satisfies Meta<
  typeof RulesList
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Rules: Story = {};

export const NoRules: Story = { args: { rules: null } };
