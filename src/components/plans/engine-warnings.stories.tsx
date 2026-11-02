import type { Meta, StoryObj } from "@storybook/react-vite";
import { EngineWarnings } from "./engine-warnings";
import { warnings } from "./fixtures";

const meta = { component: EngineWarnings, args: { warnings } } satisfies Meta<typeof EngineWarnings>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Several: Story = {};

export const One: Story = { args: { warnings: warnings.slice(0, 1) } };

// Shows nothing at all.
export const None: Story = { args: { warnings: [] } };
