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
