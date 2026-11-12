import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import type { ScheduleBlock } from "@/model/schedule";
import { closedDays, doublehandedOfferings, summerOfferings, summerSchedule } from "./fixtures";
import { PlanCalendar } from "./plan-calendar";

/** Each Doublehanded offering's Tuesday and Thursday practices, J-Pod on Tuesdays and the rest on Thursdays. */
const doublehanded: ScheduleBlock[] = doublehandedOfferings.flatMap((o) => {
  const out: ScheduleBlock[] = [];
  for (
    let d = new Date(`${o.starts_on}T00:00:00Z`);
    d <= new Date(`${o.ends_on}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    if (d.getUTCDay() !== (o.program === "J-Pod" ? 2 : 4)) {
      continue;
    }
    const date = d.toISOString().slice(0, 10);
    out.push({
      key: `${o.key} ${date}`,
      date,
      name: null,
      activities: [
        {
          key: `${o.key} ${date}`,
          offering_key: o.key,
          kind: "practice",
          start_time: "16:00:00",
          end_time: "19:00:00",
          setup_minutes: 30,
          putaway_minutes: 30,
          on_water_minutes: 150,
        },
      ],
      parts: ["2 Level 3 Coaches", "2 RIBs"],
    });
  }
  return out;
});

const meta = {
  component: PlanCalendar,
  args: {
    areas: [
      { key: "summer", name: "Summer", blocks: summerSchedule, offerings: summerOfferings },
      { key: "doublehanded", name: "Doublehanded", blocks: doublehanded, offerings: doublehandedOfferings },
    ],
    closedDays,
    area: null,
    day: "2027-06-30",
    onAreaChange: () => {},
    onDayChange: () => {},
  },
  // Keeps the area and day as the page keeps them in its address.
  render: function Render(args) {
    const [area, setArea] = useState(args.area);
    const [day, setDay] = useState(args.day);
    return <PlanCalendar {...args} area={area} day={day} onAreaChange={setArea} onDayChange={setDay} />;
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
    await expect(block).toHaveTextContent("Different from the usual: 2 Level 1 Instructors.");
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

/** One area alone, as its report links to it. */
export const OneArea: Story = {
  args: { area: "doublehanded", day: null },
  play: async ({ canvas }) => {
    const year = canvas.getByRole("group", { name: "Year" });
    await expect(year).toHaveTextContent("J-Pod");
    await expect(year).not.toHaveTextContent("Guppies");
  },
};
