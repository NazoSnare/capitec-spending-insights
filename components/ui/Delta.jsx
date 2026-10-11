/**
 * A change against the previous period.
 *
 * For spending, up is bad: spending more than last month is not good news. `goodWhen`
 * says which direction is good so the colour is right; the arrow and the words always
 * say the direction itself.
 */
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatChange } from "@/lib/format";

export default function Delta({ value, goodWhen = "down", label, inverse = false }) {
  if (value === null || value === undefined) {
    return <span className="text-[12.5px] text-ink-3">No earlier data to compare</span>;
  }
  const up = value > 0;
  const flat = value === 0;
  const good = flat ? null : goodWhen === "down" ? !up : up;
  // On a dark card the tinted pills are unreadable, so the pill goes translucent white
  // and the arrow and the words carry the direction.
  const tone = inverse ? "bg-white/15 text-white" : good === null ? "bg-black/[0.05] text-ink-2" : good ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad";
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 text-[12.5px] ${inverse ? "text-white/80" : "text-ink-3"}`}>
      <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold ${tone}`}>
        <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
        <span className="num">{formatChange(value)}</span>
        <span className="sr-only">{flat ? "no change" : up ? "up" : "down"}</span>
      </span>
      {label ? <span>{label}</span> : null}
    </span>
  );
}
