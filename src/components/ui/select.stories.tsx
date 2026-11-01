import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const statuses = [
  { label: "Draft", value: "draft" },
  { label: "Saved", value: "saved" },
];

const meta = { component: Select } satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  render: () => (
    <Select items={statuses} defaultValue="draft">
      <SelectTrigger aria-label="Version" className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Version" }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(async () => expect(await body.findByRole("option", { name: "Saved" })).toBeVisible());
  },
};
