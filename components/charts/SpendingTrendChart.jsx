"use client";

/**
 * Monthly spending as rounded bars, with the average as a dashed line.
 *
 * The current month is drawn lighter and labelled "so far": it is not over, and drawn
 * like the others it looks like a sudden drop in spending.
 */
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLine, VictoryTooltip, VictoryVoronoiContainer } from "victory";
import { useSelector } from "react-redux";
import { selectHideAmounts } from "@/utils/store/preferencesSlice";
import { formatMonth, formatZAR, formatZARShort } from "@/utils/lib/format";
import { axisStyle, FONT, tooltipStyle } from "./chartTheme";
import useElementWidth from "@/utils/hooks/useElementWidth";

export default function SpendingTrendChart({ trends, height = 260 }) {
  const hidden = useSelector(selectHideAmounts);
  const [ref, width] = useElementWidth();
  const narrow = width < 480;
  const full = trends.filter((t) => !t.partial);
  const average = full.length ? full.reduce((s, t) => s + t.totalSpent, 0) / full.length : 0;
  const data = trends.map((t) => ({
    // On a narrow screen with many months, label every month by its first letter.
    x: narrow && trends.length > 12 ? formatMonth(t.month, { short: true }).slice(0, 1) + t.month.slice(2, 4) : formatMonth(t.month, { short: trends.length > 6 }),
    y: t.totalSpent,
    partial: t.partial,
    label: `${formatMonth(t.month)}${t.partial ? " (so far)" : ""}\n${hidden ? "R ••••" : formatZAR(t.totalSpent)}\n${t.transactionCount} transactions`,
  }));
  const barWidth = Math.max(5, Math.min(28, (width * 0.55) / Math.max(1, trends.length)));

  return (
    <div ref={ref} aria-hidden="true">
      <VictoryChart
        height={height}
        width={width}
        padding={{ top: 16, bottom: 36, left: narrow ? 40 : 52, right: 8 }}
        domainPadding={{ x: barWidth, y: [0, 12] }}
        containerComponent={<VictoryVoronoiContainer voronoiDimension="x" voronoiBlacklist={["average"]} />}
      >
        <VictoryAxis style={axisStyle} />
        <VictoryAxis dependentAxis style={axisStyle} tickFormat={(v) => (hidden ? "" : formatZARShort(v))} />
        <VictoryBar
          data={data}
          barWidth={barWidth}
          cornerRadius={{ top: Math.min(8, barWidth / 2) }}
          style={{ data: { fill: ({ datum }) => (datum.partial ? "#9fd8f2" : "#00486d") } }}
          labelComponent={<VictoryTooltip flyoutStyle={tooltipStyle.flyout} style={tooltipStyle.label} cornerRadius={8} flyoutPadding={{ top: 6, bottom: 6, left: 10, right: 10 }} pointerLength={6} constrainToVisibleArea />}
          animate={{ duration: 400, onLoad: { duration: 400 } }}
        />
        {/* Always rendered: Victory reads every child's props, and a `null` child (the
            line left out when there is no average yet) crashed the whole chart. */}
        <VictoryLine
          name="average"
          data={data.map((d) => ({ x: d.x, y: average }))}
          style={{ data: { stroke: average ? "#e63934" : "transparent", strokeWidth: 1.5, strokeDasharray: "5 4" } }}
        />
      </VictoryChart>
      <p className="sr-only" style={{ fontFamily: FONT }}>Average month: {formatZAR(average)}</p>
    </div>
  );
}
