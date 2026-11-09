import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { NumberedOffering } from "@/model/reports";
import { ChartCard } from "./chart-card";

const config = {
  target: { label: "Target", color: "var(--chart-1)" },
  max: { label: "Max", color: "var(--chart-2)" },
} satisfies ChartConfig;

/** Each offering's target and max sailors, one pair of bars per offering, in the order of the table below it. */
export function EnrollmentChart({ offerings }: { offerings: NumberedOffering[] }) {
  return (
    <ChartCard
      title="Sailors per offering"
      about="Target is how many sailors the plan expects. Max is how many the offering can take."
    >
      <ChartContainer config={config} className="aspect-auto w-full" style={{ height: 56 + offerings.length * 30 }}>
        <BarChart data={offerings} layout="vertical" barGap={2} margin={{ left: 8, right: 8 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="label" width={112} tickLine={false} axisLine={false} interval={0} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="target" fill="var(--color-target)" radius={[0, 4, 4, 0]} barSize={10} />
          <Bar dataKey="max" fill="var(--color-max)" radius={[0, 4, 4, 0]} barSize={10} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
