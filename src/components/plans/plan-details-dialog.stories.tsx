import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor, within } from "storybook/test";
import { PlanDetailsDialog } from "./plan-details-dialog";

const meta = {
  component: PlanDetailsDialog,
  args: {
    trigger: "Edit",
    title: "Edit Budget",
    initial: { name: "Budget", message: "Reviewed with the board" },
    submitLabel: "Save",
    onSubmit: fn(async () => {}),
  },
} satisfies Meta<typeof PlanDetailsDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Edit: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit" }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    const name = dialog.getByLabelText("Name");
    await userEvent.clear(name);
    await userEvent.type(name, "Adopted budget");
    await userEvent.click(dialog.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(args.onSubmit).toHaveBeenCalledWith({ name: "Adopted budget", message: "Reviewed with the board" }),
    );
  },
};

export const StartDraft: Story = {
  args: {
    trigger: "Start a draft from this",
    title: "Start a draft from Budget",
    description: "The new draft starts as a copy of Budget, for the same year. Budget doesn't change.",
    initial: { name: "Budget copy", message: null },
    submitLabel: "Start the draft",
  },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Start a draft from this" }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    await expect(dialog.getByLabelText("Name")).toHaveValue("Budget copy");
  },
};

export const Failed: Story = {
  args: { onSubmit: fn(async () => Promise.reject(new Error("Refused"))) },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit" }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    await userEvent.click(dialog.getByRole("button", { name: "Save" }));
    await expect(await dialog.findByRole("alert")).toHaveTextContent("That didn't work");
  },
};
