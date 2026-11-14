import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementList } from "@/components/home/announcement-list";
import { PageHeader } from "@/components/plans/page-header";
import { announcementsQuery } from "@/directus/announcements";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { data: announcements } = useSuspenseQuery(announcementsQuery);
  return (
    <main className="mx-auto max-w-6xl p-card">
      <PageHeader title="Sail Team" />
      <AnnouncementList announcements={announcements} />
    </main>
  );
}
