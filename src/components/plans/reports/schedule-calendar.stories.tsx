import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import type { ReportOffering } from "@/model/reports";
import type { ScheduleBlock } from "@/model/schedule";
import { summerOfferings, summerScheduleProps, warnings } from "./fixtures";
import { ScheduleCalendar } from "./schedule-calendar";

const meta = {
  component: ScheduleCalendar,
  args: { ...summerScheduleProps, offerings: summerOfferings, warnings: warnings.filter((w) => w.area === "summer") },
} satisfies Meta<typeof ScheduleCalendar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Summer: Story = {
  play: async ({ canvas }) => {
    const cards = within(canvas.getByRole("region", { name: "Activity blocks" }));
    await expect(cards.getByRole("article", { name: "Morning dock" })).toHaveTextContent("Guppies 1–9");
    await userEvent.click(canvas.getByRole("button", { name: "Jul 12" }));
    await expect(canvas.getByRole("table", { name: "Weeks" })).toHaveTextContent("9 / 10");
    await expect(canvas.getByRole("table", { name: "Week of Jul 12" })).toHaveTextContent("Morning dock");
  },
};

// Twelve made-up programs on one weekday morning: the last two take a color again, striped.
const names = [
  "Guppies",
  "Sea Otters",
  "Opti Camp",
  "Sailqube Camp",
  "420 Camp",
  "Keelboat Camp",
  "Adventure Camp",
].concat(["Windsurf Camp", "Kayak Camp", "Race Camp", "ILCA Camp", "Foiling Camp"]);
const many: ReportOffering[] = names.map((program) => ({
  key: program,
  program,
  session: "Week 1",
  starts_on: "2027-06-21",
  ends_on: "2027-06-25",
  fee_cents: 50_000,
  estimated: 8,
  max: 10,
  days: 5,
  hours: 15,
  cogs_rate: null,
  note: null,
}));
const manyBlocks: ScheduleBlock[] = ["2027-06-21", "2027-06-22", "2027-06-23"].map((date) => ({
  key: date,
  date,
  name: "Camp morning",
  activities: names.map((program) => ({
    key: `${program} ${date}`,
    offering_key: program,
    kind: "practice",
    start_time: "09:00:00",
    end_time: "12:00:00",
    setup_minutes: null,
    putaway_minutes: null,
    on_water_minutes: 180,
  })),
  parts: ["8 Level 1 Instructors", "6 RIBs"],
}));

export const TwelvePrograms: Story = {
  args: { blocks: manyBlocks, offerings: many, warnings: [], closedDays: [], elsewhere: [] },
};
