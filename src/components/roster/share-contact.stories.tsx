import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ShareContact } from "./share-contact";

const meta = {
  component: ShareContact,
  args: { shares: false, guardian: true, onChange: fn() },
} satisfies Meta<typeof ShareContact>;
export default meta;
type Story = StoryObj<typeof meta>;

export const NotSharing: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const choice = canvas.getByRole("switch", { name: "Share my email and phone with my child's team" });
    await expect(choice).not.toBeChecked();
    await userEvent.click(choice);
    await expect(args.onChange).toHaveBeenCalledWith(true);
  },
};

export const Sharing: Story = { args: { shares: true, state: "saved" } };

export const AdultSailor: Story = { args: { guardian: false } };

export const Saving: Story = { args: { shares: true, state: "saving" } };

export const DidNotSave: Story = { args: { state: "failed" } };
