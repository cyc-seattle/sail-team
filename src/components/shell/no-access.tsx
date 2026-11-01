import { NoticePage } from "./notice-page";

/** What someone sees on a page Directus doesn't let them read. Never a blank page. */
export function NoAccess({ what }: { what: string }) {
  return (
    <NoticePage title={`You don't have access to ${what}`}>
      <p>If you think you should, ask the person who runs it at the club.</p>
    </NoticePage>
  );
}
