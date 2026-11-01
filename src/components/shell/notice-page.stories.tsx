import type { Meta, StoryObj } from "@storybook/react-vite";
import { NoAccess } from "./no-access";
import { NoticePage } from "./notice-page";
import { SignInBlocked } from "./sign-in-blocked";

const meta = { component: NoticePage, args: { title: "There's no page here" } } satisfies Meta<typeof NoticePage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const NotFound: Story = {};

export const NoAccessToPlans: Story = { render: () => <NoAccess what="plans" /> };

export const SignInDidNotFinish: Story = {
  render: () => <SignInBlocked signInUrl="https://directus.example.org/auth/login/authentik?redirect=x" />,
};
