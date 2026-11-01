import type { Meta, StoryObj } from "@storybook/react-vite";
import { InfoIcon } from "lucide-react";
import { expect, waitFor, within } from "storybook/test";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "./popover";

const meta = { component: Popover } satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label="How is this calculated?" />}>
        <InfoIcon />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Per sailor-day</PopoverTitle>
          <PopoverDescription>The net amount divided by every sailor's days on the water.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "How is this calculated?" }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(async () => expect(await body.findByText("Per sailor-day")).toBeVisible());
  },
};
