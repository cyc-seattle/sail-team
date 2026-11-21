import { useQueryClient } from "@tanstack/react-query";
import type { Permissions } from "@/directus/access";
import { canSeeCrew } from "@/directus/crew";
import { useSession } from "@/directus/use-session";

/** The signed-in person's permissions, or undefined, and whether they can open Crew at all. */
export function useCrewAccess(): { permissions: Permissions | undefined; allowed: boolean } {
  const session = useSession();
  const permissions = session.kind === "signed-in" ? session.permissions : undefined;
  return { permissions, allowed: canSeeCrew(permissions) };
}

/** Reads Crew again after a change. */
export function useRefreshCrew() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["crew"] });
}
