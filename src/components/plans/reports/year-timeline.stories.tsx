import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import type { ScheduleBlock } from "@/model/schedule";
import { withRouter } from "../../../../.storybook/with-router";
import { doublehandedOfferings, summerOfferings, summerSchedule } from "./fixtures";
import { YearTimeline } from "./year-timeline";

/** Each Tuesday and Thursday of each Doublehanded offering, J-Pod on Tuesdays and the rest on Thursdays. */
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
  component: YearTimeline,
  decorators: [withRouter("/plans/financial/budget", ["/plans/financial/$setId/$planId"])],
  args: {
    setId: "budget",
    areas: [
      { key: "doublehanded", name: "Doublehanded", blocks: doublehanded, offerings: doublehandedOfferings },
      { key: "summer", name: "Summer", blocks: summerSchedule, offerings: summerOfferings },
    ],
  },
} satisfies Meta<typeof YearTimeline>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Year: Story = {};

/** An area opens to its programs; a week shows every area, each with its programs' sailors. */
export const AWeekAcrossAreas: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Summer" }));
    await expect(canvas.getByText("Race Camp")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Week of Jul 12" }));
    const week = canvas.getByRole("table", { name: "Week of Jul 12 across program areas" });
    await expect(week).toHaveTextContent("2 programs · 21 / 26");
    await userEvent.click(canvas.getByRole("button", { name: "Week after" }));
    await expect(canvas.getByRole("heading", { name: "Jul 19 to 23" })).toBeVisible();
  },
};
