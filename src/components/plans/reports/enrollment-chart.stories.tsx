import type { Meta, StoryObj } from "@storybook/react-vite";
import { numberedOfferings } from "@/model/reports";
import { doublehandedOfferings, summerOfferings } from "./fixtures";
import { EnrollmentChart } from "./enrollment-chart";

const numbered = (offerings: typeof summerOfferings) => numberedOfferings(offerings).flatMap((g) => g.offerings);

const meta = {
  component: EnrollmentChart,
  args: { offerings: numbered(doublehandedOfferings) },
} satisfies Meta<typeof EnrollmentChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Seasons: Story = {};

export const SummerWeeks: Story = { args: { offerings: numbered(summerOfferings) } };
