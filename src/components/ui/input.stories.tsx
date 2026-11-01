import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";
import { Label } from "./label";

const meta = { component: Input } satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="boat-name">Boat name</Label>
      <Input id="boat-name" placeholder="Sea Otter" />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="sailors">Sailors per session</Label>
      <Input id="sailors" defaultValue="-3" aria-invalid aria-describedby="sailors-error" />
      <p id="sailors-error" className="text-sm text-destructive">
        Enter a number of sailors, 1 or more.
      </p>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="season">Season</Label>
      <Input id="season" defaultValue="2027" disabled />
    </div>
  ),
};
