import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { expect, waitFor, within } from "storybook/test";
import { Button } from "./button";
import { Toaster } from "./sonner";

const meta = { component: Toaster } satisfies Meta<typeof Toaster>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Saved: Story = {
  render: () => (
    <>
      <Toaster />
      <Button onClick={() => toast.success("Plan saved")}>Save</Button>
    </>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(async () =>
      expect(await within(canvasElement.ownerDocument.body).findByText("Plan saved")).toBeVisible(),
    );
  },
};
