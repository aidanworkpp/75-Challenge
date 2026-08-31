// Accent palette. Each value is an "R G B" triple consumed by the CSS variable
// --accent-rgb, which the Tailwind `accent` colour references with alpha support.
// All chosen to read well with black text on a filled button.

export interface AccentOption {
  key: string;
  label: string;
  rgb: string; // "R G B"
}

export const ACCENTS: AccentOption[] = [
  { key: "orange", label: "Orange", rgb: "249 115 22" },
  { key: "amber",  label: "Amber",  rgb: "245 158 11" },
  { key: "lime",   label: "Lime",   rgb: "132 204 22" },
  { key: "green",  label: "Green",  rgb: "34 197 94" },
  { key: "teal",   label: "Teal",   rgb: "20 184 166" },
  { key: "blue",   label: "Blue",   rgb: "59 130 246" },
  { key: "purple", label: "Purple", rgb: "168 85 247" },
  { key: "rose",   label: "Rose",   rgb: "244 63 94" },
];

export const DEFAULT_ACCENT = "orange";

export function accentRgb(key: string | null | undefined): string {
  return ACCENTS.find((a) => a.key === key)?.rgb ?? ACCENTS[0].rgb;
}
