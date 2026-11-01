import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

const meta = { component: Card } satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Summer camps</CardTitle>
        <CardDescription>Ten weeks of half-day camps for ages 8 to 12.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Four instructors and two boats per session.</p>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Last saved by a planner.</p>
      </CardFooter>
    </Card>
  ),
};
