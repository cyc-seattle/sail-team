import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlertIcon, InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert";

const meta = { component: Alert } satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Alert>
      <InfoIcon />
      <AlertTitle>This plan is a draft</AlertTitle>
      <AlertDescription>Its numbers change as planners edit it.</AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>The plan couldn't load</AlertTitle>
      <AlertDescription>Check your connection and try again.</AlertDescription>
    </Alert>
  ),
};
