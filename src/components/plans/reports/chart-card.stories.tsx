import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import { ChartCard } from "./chart-card";

const meta = {
  component: ChartCard,
  args: {
    title: "Sailors per offering",
    about: "Target is how many sailors the plan expects. Max is how many the offering can take.",
    children: <div className="h-24 rounded-md bg-muted" />,
  },
} satisfies Meta<typeof ChartCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const About: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "About sailors per offering" }));
    await waitFor(async () => expect(await screen.findByText(/Target is how many/)).toBeVisible());
  },
};
