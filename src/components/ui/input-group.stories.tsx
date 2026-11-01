import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "./input-group";

const meta = { component: InputGroup } satisfies Meta<typeof InputGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Search: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput placeholder="Find a sailor" aria-label="Find a sailor" />
    </InputGroup>
  ),
};

export const Money: Story = {
  render: () => (
    <InputGroup className="max-w-48">
      <InputGroupAddon>
        <InputGroupText>$</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput inputMode="decimal" defaultValue="450.00" aria-label="Fee" className="tabular-nums" />
    </InputGroup>
  ),
};
