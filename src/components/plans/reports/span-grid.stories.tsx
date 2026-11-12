import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import { SpanGrid } from "./span-grid";

const weeks = ["Mar 1", "Mar 8", "Mar 15", "Mar 22", "Mar 29", "Apr 5"];

const meta = {
  component: SpanGrid,
  args: {
    label: "Weeks",
    columnWidth: "3.5rem",
    columns: weeks.map((w) => ({ key: w, name: w, head: w })),
    rows: [
      { key: "area", name: "Doublehanded", heading: true, spans: [] },
      {
        key: "j-pod",
        name: "J-Pod",
        spans: [{ key: "spring", from: 0, to: 3, label: "J-Pod Spring", className: "bg-(--area-1)" }],
      },
      {
        key: "k-pod",
        name: "K-Pod",
        spans: [
          { key: "a", from: 1, to: 2, label: "K-Pod Spring", className: "bg-(--area-2)" },
          { key: "b", from: 4, to: 5, label: "K-Pod Spring", className: "bg-(--area-2)" },
        ],
      },
    ],
  },
  render: function Render(args) {
    const [chosen, setChosen] = useState<string | null>(null);
    return <SpanGrid {...args} chosen={chosen} onChoose={setChosen} />;
  },
} satisfies Meta<typeof SpanGrid>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A column is chosen from anywhere in it. */
export const ChooseAColumn: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Mar 15" }));
    await expect(canvas.getByRole("button", { name: "Mar 15" })).toHaveAttribute("aria-pressed", "true");
  },
};
