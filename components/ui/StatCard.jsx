/**
 * One headline figure: a small label, the figure as the largest text, and a line under
 * it (usually a Delta). Used for the four summary figures.
 */
import Card from "./Card";

export default function StatCard({ label, icon: Icon, value, footer, emphasis = false }) {
  return (
    <Card as="div" className={emphasis ? "!border-navy !bg-navy text-white" : ""}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-[13px] font-semibold ${emphasis ? "text-white/75" : "text-ink-3"}`}>{label}</p>
        {Icon ? (
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${emphasis ? "bg-white/15 text-white" : "bg-sky-soft text-navy"}`}>
            <Icon size={18} strokeWidth={2} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <div className={`mt-2 text-[28px] font-bold leading-tight tracking-[-0.02em] ${emphasis ? "text-white" : "text-ink"}`}>{value}</div>
      {footer ? <div className="mt-2">{footer}</div> : null}
    </Card>
  );
}
