/** The seasons an offering can run in (cyc-seattle/platform#251). One with none, such as Adult Learn to Sail, has no season. */
export const SEASONS = ["winter", "spring", "summer", "fall"] as const;

export type Season = (typeof SEASONS)[number];

/** A season as staff write it: Winter, Spring, Summer, Fall. */
export const seasonName = (season: Season) => season[0]!.toUpperCase() + season.slice(1);

/** An offering's season, or null for none. A plan frozen before the list can still hold free text, which is none. */
export function seasonOf(offering: { season_term: string | null }): Season | null {
  return (SEASONS as readonly string[]).includes(offering.season_term ?? "") ? (offering.season_term as Season) : null;
}
