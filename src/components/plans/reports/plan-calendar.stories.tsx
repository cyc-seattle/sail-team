import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import { closedDays, doublehandedOfferings, doublehandedSchedule, summerOfferings, summerSchedule } from "./fixtures";
import { PlanCalendar } from "./plan-calendar";

const meta = {
  component: PlanCalendar,
  args: {
    areas: [
      { key: "summer", name: "Summer", blocks: summerSchedule, offerings: summerOfferings },
      { key: "doublehanded", name: "Doublehanded", blocks: doublehandedSchedule, offerings: doublehandedOfferings },
    ],
    closedDays,
    day: "2027-06-30",
    onDayChange: () => {},
  },
  // Keeps the day as the page keeps it in its address.
  render: function Render(args) {
    const [day, setDay] = useState(args.day);
    return <PlanCalendar {...args} day={day} onDayChange={setDay} />;
  },
} satisfies Meta<typeof PlanCalendar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every area's offerings over the year, and a day's blocks at their times. */
export const Calendar: Story = {};

/** A block opens to what it shares, and says how a day differs from its usual. */
export const ABlockThatDiffers: Story = {
  args: { day: "2027-06-29" },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /^Morning dock.*different from the usual$/ }));
    const block = canvas.getByRole("complementary", { name: "Activity block" });
    await expect(block).toHaveTextContent("Guppies Week 2");
    await expect(block).toHaveTextContent("Different from the usual: 2 Instructors.");
  },
};

/** A week is chosen from anywhere in its column, and a closed day says so. */
export const AClosedDay: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Week of Jul 5" }));
    await userEvent.click(canvas.getByRole("button", { name: "Mon 5 Closed" }));
    await expect(canvas.getByRole("heading", { name: /Closed for Independence Day, observed/ })).toBeVisible();
  },
};

/** A block of one activity is just that activity, with its sailors, and its staff and boats one to a line. */
export const ABlockOfOne: Story = {
  args: { day: "2027-06-29" },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /^J-Pod Summer/ }));
    const block = canvas.getByRole("complementary", { name: "Activity block" });
    await expect(canvas.getByRole("heading", { name: "J-Pod Summer" })).toBeVisible();
    await expect(block).toHaveTextContent("9 of 16 sailors");
    await expect(canvas.getByRole("list", { name: "Staff, coach boats and boats" })).toHaveTextContent(
      "4 sailor-owned 420s",
    );
  },
};
