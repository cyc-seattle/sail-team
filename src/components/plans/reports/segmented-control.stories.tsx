import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import { SegmentedControl } from "./segmented-control";

function Example() {
  const [value, setValue] = useState<"session" | "program">("session");
  return (
    <SegmentedControl
      label="Group enrollment"
      value={value}
      onChange={setValue}
      options={[
        { value: "session", label: "By session" },
        { value: "program", label: "By program" },
      ]}
    />
  );
}

const meta = { component: Example } satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;

export const BySession: Story = {};

/** The chosen side stays chosen when pressed again. */
export const ByProgram: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "By program" }));
    await userEvent.click(canvas.getByRole("button", { name: "By program" }));
    await expect(canvas.getByRole("button", { name: "By program" })).toHaveAttribute("aria-pressed", "true");
  },
};
