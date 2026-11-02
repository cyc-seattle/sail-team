import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatCents } from "@/model/money";

const config = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  expenses: { label: "Expenses", color: "var(--chart-2)" },
} satisfies ChartConfig;

export interface RevenueExpenseBar {
  name: string;
  revenue_cents: number;
  expense_cents: number;
}

/** Revenue beside expenses for each offering or product. It sits in a Chart Card above the table of the same numbers. */
export function RevenueExpenseChart({ bars }: { bars: RevenueExpenseBar[] }) {
  const data = bars.map((b) => ({ name: b.name, revenue: b.revenue_cents, expenses: b.expense_cents }));
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={80} tickFormatter={(cents: number) => formatCents(cents)} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex flex-1 justify-between gap-4">
                  <span className="text-muted-foreground">{config[name as keyof typeof config]?.label ?? name}</span>
                  <span className="tabular-nums">{formatCents(Number(value))}</span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
