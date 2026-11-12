// The calendar's colors: a family for each program area, and a shade of it for each program.

/** How many color families there are (`--area-1` and on); a seventh area takes the first again. */
export const AREA_FAMILIES = 6;

/** Each program's shift in hue from its area's color, in the order its programs start; an eleventh takes the first again. */
export const PROGRAM_HUE_STEPS = [0, 10, -10, 20, -20, 5, -5, 15, -15, 25];

/** A program's color, the `n`th of its area, the `area`th: a shade of the area's family. */
export const programColor = (area: number, n: number) =>
  `oklch(from var(--area-${(area % AREA_FAMILIES) + 1}) l c calc(h + ${PROGRAM_HUE_STEPS[n % PROGRAM_HUE_STEPS.length]}))`;
