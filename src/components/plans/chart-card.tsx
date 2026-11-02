import { InfoIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ChartCardProps {
  title: string;
  /** How the numbers are worked out, behind the info button. */
  explanation: ReactNode;
  chart: ReactNode;
  /**
   * The same numbers as a table. Every chart has one: screen readers read a chart poorly, and a planner checks the
   * table. The chart itself stays keyboard-navigable.
   */
  table: ReactNode;
}

/** A chart, with its title, how it's worked out, and the table of the same numbers below it. */
export function ChartCard({ title, explanation, chart, table }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <Popover>
            <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label={`How "${title}" is worked out`} />}>
              <InfoIcon />
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>How it's worked out</PopoverTitle>
                <PopoverDescription>{explanation}</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-card">
        {chart}
        {table}
      </CardContent>
    </Card>
  );
}
