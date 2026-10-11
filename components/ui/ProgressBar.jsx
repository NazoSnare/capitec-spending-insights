/** A bar showing how much of something is used, with an accessible value. */
const TONES = { ok: "bg-ok", warn: "bg-[#d98a00]", bad: "bg-bad", info: "bg-sky" };

export default function ProgressBar({ value, max = 100, tone = "info", label, marker }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(Math.min(value, max) * 100) / 100}
      className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06]"
    >
      <div className={`h-full rounded-full transition-[width] duration-500 ${TONES[tone]}`} style={{ width: `${pct}%` }} />
      {marker !== undefined ? (
        // Where spending "should" be by today, so pace is visible at a glance.
        <span aria-hidden="true" className="absolute top-[-2px] h-[14px] w-[2px] rounded bg-ink/40" style={{ left: `calc(${Math.min(100, marker)}% - 1px)` }} />
      ) : null}
    </div>
  );
}
