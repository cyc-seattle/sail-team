import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { NoticePage } from "@/components/shell/notice-page";
import { SignInBlocked } from "@/components/shell/sign-in-blocked";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/directus/use-session";
import { displayName } from "@/model/display-name";
import { pagesFor } from "@/model/nav";

export const Route = createRootRoute({
  component: Root,
  notFoundComponent: () => <NoticePage title="There's no page here" />,
  errorComponent: () => (
    <NoticePage title="Something went wrong">
      <p>The club's system didn't answer. Reload the page to try again.</p>
    </NoticePage>
  ),
});

function Root() {
  return (
    <Suspense fallback={<Loading />}>
      <Signed />
    </Suspense>
  );
}

function Signed() {
  const session = useSession();
  switch (session.kind) {
    case "redirecting":
      return <Loading />;
    case "blocked":
      return <SignInBlocked signInUrl={session.signInUrl} />;
    case "signed-in":
      return (
        <AppShell name={displayName(session.me)} pages={pagesFor(session.permissions)}>
          <Outlet />
        </AppShell>
      );
  }
}

function Loading() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto grid max-w-6xl gap-2 p-card">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
