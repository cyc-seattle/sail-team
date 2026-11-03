const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export type MoneyTone = "positive" | "negative" | "zero";

/** Cents as dollars: `123456` → `$1,234.56`, `-5000` → `−$50.00`, with a true minus sign so columns line up. */
export function formatCents(cents: number): string {
  const text = dollars.format(Math.abs(cents) / 100);
  return cents < 0 ? `−${text}` : text;
}

/** Which color a net amount takes: only the amount is colored, never its row's label. */
export function toneOf(cents: number): MoneyTone {
  return cents > 0 ? "positive" : cents < 0 ? "negative" : "zero";
}
