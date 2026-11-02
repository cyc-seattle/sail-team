import type { Meta, StoryObj } from "@storybook/react-vite";
import { Money } from "./money";

const meta = { component: Money, args: { cents: 123456 } } satisfies Meta<typeof Money>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Amounts: Story = {
  render: () => (
    <ul className="grid w-40 gap-1 text-right text-sm">
      <li>
        <Money cents={1_000_000} />
      </li>
      <li>
        <Money cents={-60_000} />
      </li>
      <li>
        <Money cents={5} />
      </li>
    </ul>
  ),
};

// A net is colored by its sign. Only the amount, never the row's label.
export const Nets: Story = {
  render: () => (
    <ul className="grid w-40 gap-1 text-right text-sm">
      <li>
        <Money cents={400_000} colored />
      </li>
      <li>
        <Money cents={-60_000} colored />
      </li>
      <li>
        <Money cents={0} colored />
      </li>
    </ul>
  ),
};
