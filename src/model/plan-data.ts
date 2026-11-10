/**
 * The fields Directus returns as strings, so no precision is lost, and the engine reads as numbers. From
 * platform's schemas/*.yaml: every `decimal` field in the plan and catalog tables.
 */
export const decimalFields: Record<string, readonly string[]> = {
  plan_offerings: ["fill_rate", "cogs_rate"],
  plan_programs: ["sailors_per_coach"],
  plan_block_resources: ["quantity", "hours"],
  plan_labor_lines: ["hours"],
  plan_rates: ["payroll_tax_rate"],
  plan_revenue_charges: ["rate"],
  plan_salaried_positions: ["ga_share"],
  plan_salaried_bookings: ["hours"],
  plan_bonus_owners: ["bonus_rate"],
  boat_classes: ["footprint_sq_ft"],
};

type Row = Record<string, unknown>;

/** Rows as the engine reads them: decimals as numbers. Dates and JSON come from Directus as the engine wants them. */
export function engineRows(table: string, rows: Row[]): Row[] {
  const decimals = decimalFields[table];
  if (!decimals) {
    return rows;
  }
  return rows.map((row) => {
    const out = { ...row };
    for (const field of decimals) {
      if (out[field] !== null && out[field] !== undefined) {
        out[field] = Number(out[field]);
      }
    }
    return out;
  });
}
