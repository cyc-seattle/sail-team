import type { Meta, StoryObj } from "@storybook/react-vite";
import { sailor } from "./fixtures";
import { SignUps } from "./sign-ups";

const meta = {
  component: SignUps,
  args: { signUps: sailor.signUps! },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SignUps>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Some: Story = {};

export const None: Story = { args: { signUps: [] } };
