/** A labelled date input. */
import { useId } from "react";

export default function DateField({ label, value, onChange, min, max, invalid }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[12.5px] font-semibold text-ink-2">{label}</label>
      <input
        id={id}
        type="date"
        value={value || ""}
        min={min}
        max={max}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 rounded-xl border bg-card px-3 text-[14px] text-ink outline-none focus:border-sky ${invalid ? "border-bad" : "border-hair"}`}
      />
    </div>
  );
}
