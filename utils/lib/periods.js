/** The quick periods the dashboard offers, matching the API's `period` values. */
export const PERIODS = [
  { value: "7d", label: "7 days", long: "Last 7 days" },
  { value: "30d", label: "30 days", long: "Last 30 days" },
  { value: "90d", label: "90 days", long: "Last 90 days" },
  { value: "1y", label: "1 year", long: "Last year" },
];

export const periodLabel = (value) => PERIODS.find((p) => p.value === value)?.long || value;

/** "vs previous 30 days" for the summary's comparison line. */
export const comparedLabel = (value) => {
  const p = PERIODS.find((x) => x.value === value);
  return p ? `vs previous ${p.label}` : "vs previous period";
};

/**
 * The period buttons, from the API's `/filters` presets when they have arrived, so a
 * period added on the server appears without a front-end change. "Last 7 days" is
 * shortened to "7 days" for the button; the full label stays as its accessible name.
 * Until the presets arrive, the built-in list is used.
 */
export function periodOptions(presets) {
  const source = presets?.length ? presets : PERIODS.map((p) => ({ value: p.value, label: p.long }));
  return source.map((p) => ({
    value: p.value,
    label: p.label.replace(/^Last\s+/i, "").replace(/^year$/i, "1 year"),
    title: p.label,
  }));
}
