"use client";

/**
 * Spending by category as a donut, with the total in the middle.
 *
 * The slices are interactive (hover or focus shows the category, amount and share),
 * but the same figures are always in the list beside it: a chart alone is not
 * accessible, so the list is the record and the chart is the picture.
 */
import { VictoryPie, VictoryTooltip, VictoryLabel } from "victory";
import { useSelector } from "react-redux";
import { selectHideAmounts } from "@/utils/store/preferencesSlice";
import { formatZAR } from "@/utils/lib/format";
import { FONT, tooltipStyle } from "./chartTheme";

export default function CategoryDonut({ categories, total, size = 240, activeName, onActive }) {
  const hidden = useSelector(selectHideAmounts);
  const data = categories.map((c) => ({
    x: c.name,
    y: c.amount,
    color: c.color,
    label: `${c.name}\n${hidden ? "R ••••" : formatZAR(c.amount)} · ${c.percentage}%`,
  }));
  return (
    <figure className="m-0" aria-label={`Spending by category, total ${hidden ? "hidden" : formatZAR(total)}`}>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }} role="img" aria-hidden="true">
        <VictoryPie
          standalone={false}
          width={size}
          height={size}
          data={data}
          innerRadius={size * 0.3}
          radius={({ datum }) => (datum.x === activeName ? size * 0.47 : size * 0.44)}
          padAngle={1.2}
          cornerRadius={3}
          style={{ data: { fill: ({ datum }) => datum.color, stroke: "#fff", strokeWidth: 1 } }}
          labelComponent={<VictoryTooltip flyoutStyle={tooltipStyle.flyout} style={tooltipStyle.label} cornerRadius={8} flyoutPadding={{ top: 6, bottom: 6, left: 10, right: 10 }} pointerLength={6} constrainToVisibleArea />}
          events={[{
            target: "data",
            eventHandlers: {
              onMouseOver: () => [{ target: "labels", mutation: () => ({ active: true }) }, { target: "data", mutation: (p) => { onActive?.(p.datum.x); return null; } }],
              onMouseOut: () => [{ target: "labels", mutation: () => ({ active: false }) }, { target: "data", mutation: () => { onActive?.(null); return null; } }],
            },
          }]}
          animate={{ duration: 400 }}
        />
        <VictoryLabel
          textAnchor="middle"
          verticalAnchor="middle"
          x={size / 2}
          y={size / 2}
          text={[hidden ? "R ••••" : formatZAR(total, { cents: false }), "spent"]}
          style={[{ fontFamily: FONT, fontSize: 20, fontWeight: 700, fill: "#0f1d2a" }, { fontFamily: FONT, fontSize: 11.5, fill: "#5d6d81" }]}
          lineHeight={[1.2, 1.4]}
        />
      </svg>
    </figure>
  );
}
