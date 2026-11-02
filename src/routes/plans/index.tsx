import { createFileRoute } from "@tanstack/react-router";
import { NoAccess } from "@/components/shell/no-access";
import { canRead } from "@/directus/access";
import { useSession } from "@/directus/use-session";

export const Route = createFileRoute("/plans/")({
  component: Plans,
});

function Plans() {
  const session = useSession();
  if (session.kind !== "signed-in" || !canRead(session.permissions, "plans")) {
    return <NoAccess what="plans" />;
  }
  return (
    <main className="mx-auto max-w-6xl p-card">
      <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
    </main>
  );
}
