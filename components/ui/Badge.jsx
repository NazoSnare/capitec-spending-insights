/**
 * A status label. Every tone also carries a word: colour alone fails colour-blind
 * customers and screen readers.
 */
const TONES = {
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  info: "bg-sky-soft text-navy",
  neutral: "bg-black/[0.05] text-ink-2",
};

export default function Badge({ tone = "neutral", icon: Icon, children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold ${TONES[tone] || TONES.neutral} ${className}`}>
      {Icon ? <Icon size={13} strokeWidth={2.2} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
