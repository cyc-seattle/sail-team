import { InfoIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** A chart with its title, and how its numbers are worked out behind the info button (docs/design.md). */
export function ChartCard({ title, about, children }: { title: string; about: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <Popover>
            <PopoverTrigger
              aria-label={`About ${title.toLowerCase()}`}
              className="inline-flex size-tap items-center justify-center rounded-md text-muted-foreground hover:text-foreground md:size-8"
            >
              <InfoIcon className="size-4" aria-hidden />
            </PopoverTrigger>
            <PopoverContent align="end" aria-label={title}>
              {about}
            </PopoverContent>
          </Popover>
        </CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
