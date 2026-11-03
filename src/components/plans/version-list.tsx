import { Link } from "@tanstack/react-router";
import type { VersionSummary } from "@/directus/plans";
import { formatDate } from "@/model/dates";
import { newestFirst, stateOf } from "@/model/plan-list";
import { VersionBadge } from "./version-badge";

/** A plan's versions, newest first, each linking to its P&L, with the active one marked. */
export function VersionList({
  planId,
  versions,
  activeId,
}: {
  planId: string;
  versions: VersionSummary[];
  activeId: string | null;
}) {
  if (versions.length === 0) {
    return <p className="text-sm text-muted-foreground">This plan has no versions yet.</p>;
  }
  return (
    <ul className="grid gap-2">
      {newestFirst(versions).map((version) => (
        <li key={version.id}>
          <Link
            to="/plans/$planId/$versionId"
            params={{ planId, versionId: version.id }}
            className="flex min-h-tap flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-card p-card ring-1 ring-border hover:ring-ring"
          >
            <VersionBadge state={stateOf(version, activeId)} />
            <span className="text-sm">
              {version.status === "draft" ? "Draft" : `Saved ${formatDate(version.saved_at)}`}
            </span>
            {version.message && <span className="text-sm text-muted-foreground">{version.message}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
