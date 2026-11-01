import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { Button } from "./button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";

const meta = { component: Sheet } satisfies Meta<typeof Sheet>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Filter the roster</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter the roster</SheetTitle>
          <SheetDescription>Show sailors from one program at a time.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Filter the roster" }));
    await waitFor(async () =>
      expect(await within(canvasElement.ownerDocument.body).findByRole("dialog")).toBeVisible(),
    );
  },
};
