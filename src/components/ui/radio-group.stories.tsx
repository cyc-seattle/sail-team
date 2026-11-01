import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";

const meta = { component: RadioGroup } satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="half" aria-label="Session length">
      <Label>
        <RadioGroupItem value="half" /> Half day
      </Label>
      <Label>
        <RadioGroupItem value="full" /> Full day
      </Label>
    </RadioGroup>
  ),
};
