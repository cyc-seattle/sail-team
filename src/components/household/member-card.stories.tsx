import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { otherGuardian, me, sailor } from "./fixtures";
import { MemberCard } from "./member-card";

const meta = {
  component: MemberCard,
  args: { member: me, onSave: fn(async () => {}) },
  // As wide as a card in the page's two columns.
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MemberCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Me: Story = {};

export const OtherGuardian: Story = { args: { member: otherGuardian } };

export const Sailor: Story = { args: { member: sailor } };

export const EditingSailor: Story = {
  args: { member: sailor },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Addie Tiller" }));
    await expect(canvas.getByLabelText("School")).toHaveValue("Lakeside Middle School");
  },
};

export const SavingSailor: Story = {
  args: { member: sailor },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Addie Tiller" }));
    const school = canvas.getByLabelText("School");
    await userEvent.clear(school);
    await userEvent.type(school, "Eastlake High School");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(args.onSave).toHaveBeenCalledWith({
      display_name: "Addie Tiller",
      phone: null,
      school: "Eastlake High School",
    });
    await expect(canvas.getByRole("status")).toHaveTextContent("Saved.");
  },
};

export const EditingOtherGuardian: Story = {
  args: { member: otherGuardian },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Sam Tiller" }));
    await expect(canvas.getByLabelText("Name")).toBeVisible();
    await expect(canvas.queryByLabelText("Phone")).toBeNull();
    await expect(canvas.queryByLabelText("School")).toBeNull();
  },
};

export const DidNotSave: Story = {
  args: { onSave: fn(() => Promise.reject(new Error("forbidden"))) },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Robin Tiller" }));
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("That didn't save. Try again.");
    await expect(canvas.getByLabelText("Phone")).toBeVisible();
  },
};
