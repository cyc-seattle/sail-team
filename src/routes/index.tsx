import { createFileRoute } from "@tanstack/react-router";
import { LinkList } from "@/components/home/link-list";
import { PageHeader } from "@/components/plans/page-header";
import { useSession } from "@/directus/use-session";
import { externalLinks, homeLinksFor } from "@/model/nav";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const session = useSession();
  const links = session.kind === "signed-in" ? homeLinksFor(session.permissions) : externalLinks;
  return (
    <main className="mx-auto max-w-6xl p-card">
      <PageHeader title="Sail Team" />
      <LinkList links={links} />
    </main>
  );
}
