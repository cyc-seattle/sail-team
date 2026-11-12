import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(import.meta.dirname, "../src/styles/tokens.css"), "utf8");

/** A block's custom properties, with `var(--x)` resolved against `fallback`. */
function tokens(selector: string, fallback: Record<string, string> = {}): Record<string, string> {
  const block = css.slice(css.indexOf(`${selector} {`)).split("}")[0]!;
  const own = Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));
  const all = { ...fallback, ...own };
  const resolveVar = (value: string): string => {
    const ref = /^var\(--([\w-]+)\)$/.exec(value);
    return ref ? resolveVar(all[ref[1]!]!) : value;
  };
  return Object.fromEntries(Object.entries(all).map(([k, v]) => [k, resolveVar(v)]));
}

/** WCAG relative luminance of an opaque `oklch(L C H)`. */
function luminance(color: string): number {
  const [l, c, h] = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(color)!.slice(1).map(Number) as [
    number,
    number,
    number,
  ];
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const [lc, mc, sc] = [
    l + 0.3963377774 * a + 0.2158037573 * b,
    l - 0.1055613458 * a - 0.0638541728 * b,
    l - 0.0894841775 * a - 1.291485548 * b,
  ].map((x) => x ** 3) as [number, number, number];
  const rgb = [
    4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
  ].map((x) => Math.min(1, Math.max(0, x)));
  return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
}

const contrast = (x: string, y: string) => {
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

const light = tokens(":root");
const themes = { light, dark: tokens(".dark", light) };

// Text pairs need 4.5:1 (WCAG 1.4.3).
const textPairs = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["primary-foreground", "primary"],
  ["brand-foreground", "brand"],
  ["sidebar-foreground", "sidebar"],
  ["sidebar-accent-foreground", "sidebar-accent"],
  ["link", "background"],
  ["link", "card"],
  ["success", "card"],
  ["warning", "card"],
  ["info", "card"],
  ["destructive", "card"],
] as const;

describe.each(Object.entries(themes))("the %s theme", (_, theme) => {
  it.each(textPairs)("gives %s on %s at least 4.5:1", (fg, bg) => {
    expect(contrast(theme[fg]!, theme[bg]!)).toBeGreaterThanOrEqual(4.5);
  });

  const programs = Array.from({ length: 10 }, (_, i) => `program-${i + 1}`);

  // A mark that tells programs apart needs 3:1 against what it sits on (WCAG 1.4.11).
  it.each(programs)("gives %s at least 3:1 on the page and on a card", (name) => {
    expect(contrast(theme[name]!, theme["background"]!)).toBeGreaterThanOrEqual(3);
    expect(contrast(theme[name]!, theme["card"]!)).toBeGreaterThanOrEqual(3);
  });

  it("keeps every program color apart from the others", () => {
    const lab = (name: string) => {
      const [l, c, h] = theme[name]!.slice(6, -1).split(" ").map(Number) as [number, number, number];
      return [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)];
    };
    for (const [i, x] of programs.entries()) {
      for (const y of programs.slice(i + 1)) {
        expect(Math.hypot(...lab(x).map((v, k) => v - lab(y)[k]!)), `${x} and ${y}`).toBeGreaterThan(0.06);
      }
    }
  });

  it("gives every status color the same lightness and chroma", () => {
    const lc = (name: string) => theme[name]!.split(" ").slice(0, 2).join(" ");
    expect(new Set(["success", "warning", "info", "destructive"].map(lc)).size).toBe(1);
  });
});
