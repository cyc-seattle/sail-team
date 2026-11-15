import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LinkList } from "@/components/links/link-list";
import { PageHeader } from "@/components/plans/page-header";
import { linksQuery } from "@/directus/links";

export const Route = createFileRoute("/links")({
  component: Links,
});

function Links() {
  const { data: links } = useSuspenseQuery(linksQuery);
  return (
    <main className="mx-auto max-w-6xl p-card">
      <PageHeader title="Links" />
      <LinkList links={links} />
    </main>
  );
}
