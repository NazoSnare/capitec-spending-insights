/**
 * A labelled native select, for short fixed lists (sort order, page size, category).
 * Native, so it works with every keyboard, phone and screen reader; for a list worth
 * searching, use Combobox.
 *
 * The browser's own arrow is hidden (appearance-none) and replaced with an icon that
 * has room around it: the default sits hard against the edge and differs between
 * browsers.
 */
import { useId } from "react";
import { TbChevronDown } from "react-icons/tb";

export default function Select({ label, value, onChange, options, className = "", hideLabel = false }) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "text-[12.5px] font-semibold text-ink-2"}>{label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-hair bg-card pl-3 pr-10 text-[14px] text-ink outline-none transition-colors hover:border-ink/20 focus:border-sky"
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <TbChevronDown size={17} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" />
      </div>
    </div>
  );
}
