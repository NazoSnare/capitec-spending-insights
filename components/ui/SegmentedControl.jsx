/**
 * A choice of a few options shown side by side, as a radio group so it is one tab stop
 * and the arrow keys move between options.
 */
import { useRef } from "react";

export default function SegmentedControl({ label, options, value, onChange, size = "md" }) {
  const refs = useRef([]);
  const index = options.findIndex((o) => o.value === value);
  const move = (e) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (Math.max(0, index) + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={move} className="inline-flex rounded-full bg-black/[0.05] p-1">
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (index === -1 && i === 0) ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={`rounded-full font-semibold transition-colors ${size === "sm" ? "px-3 py-1 text-[12.5px]" : "px-3.5 py-1.5 text-[13.5px]"} ${on ? "bg-navy text-white shadow-sm" : "text-ink-2 hover:text-ink"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
