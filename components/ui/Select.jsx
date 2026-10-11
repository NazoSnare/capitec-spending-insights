/** A labelled native select: native, so it works with every keyboard, phone and screen reader. */
import { useId } from "react";

export default function Select({ label, value, onChange, options, className = "", hideLabel = false }) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "text-[12.5px] font-semibold text-ink-2"}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl border border-hair bg-card px-3 text-[14px] text-ink outline-none focus:border-sky"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
