import type { Meta, StoryObj } from "@storybook/react-vite";
import { PencilIcon } from "lucide-react";
import { expect, waitFor, within } from "storybook/test";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

const meta = { component: Tooltip } satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

// An icon-only action names itself in a tooltip.
export const RowAction: Story = {
  render: () => (
    <TooltipProvider delay={0}>
      <Tooltip>
        <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="Edit" />}>
          <PencilIcon />
        </TooltipTrigger>
        <TooltipContent>Edit</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Edit" })).toHaveFocus();
    await waitFor(async () => expect(await within(canvasElement.ownerDocument.body).findByText("Edit")).toBeVisible());
  },
};
