/**
 * Shared Victory styling, so both charts use the same type, axis and gridline colours
 * as the rest of the page instead of Victory's grey defaults.
 */
export const FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

export const axisStyle = {
  axis: { stroke: "transparent" },
  grid: { stroke: "rgba(15,29,42,0.07)", strokeDasharray: "4 4" },
  ticks: { stroke: "transparent" },
  tickLabels: { fontFamily: FONT, fontSize: 11, fill: "#5d6d81", padding: 6 },
};

export const tooltipStyle = {
  flyout: { fill: "#0f1d2a", stroke: "transparent" },
  label: { fontFamily: FONT, fontSize: 11.5, fill: "#ffffff" },
};
