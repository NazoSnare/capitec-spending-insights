"use client";

/**
 * The period for the summary and the category split: a quick period, or a custom
 * range. The range is checked here before it is sent, so the customer is told what is
 * wrong beside the field instead of getting an error from the server.
 */
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TbCalendarEvent, TbX } from "react-icons/tb";
import { selectPrefs, setCustomRange, setPeriod } from "@/store/preferencesSlice";
import { PERIODS } from "@/lib/periods";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Button from "@/components/ui/Button";
import DateField from "@/components/ui/DateField";
import { formatDay } from "@/lib/format";

const today = () => new Date().toISOString().slice(0, 10);

export function rangeProblem(startDate, endDate, max = today()) {
  if (!startDate || !endDate) return "Choose both a start and an end date.";
  if (startDate > endDate) return "The start date must be on or before the end date.";
  if (startDate > max) return "The start date cannot be in the future.";
  return null;
}

export default function PeriodToolbar() {
  const dispatch = useDispatch();
  const { period, customRange } = useSelector(selectPrefs);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(customRange || { startDate: "", endDate: "" });
  const problem = rangeProblem(draft.startDate, draft.endDate);
  const [touched, setTouched] = useState(false);

  const apply = () => {
    setTouched(true);
    if (problem) return;
    dispatch(setCustomRange(draft));
    setOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl
        label="Period"
        options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
        value={customRange ? "" : period}
        onChange={(v) => dispatch(setPeriod(v))}
      />
      {customRange ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-navy px-3 py-1.5 text-[13px] font-semibold text-white">
          {formatDay(customRange.startDate)} – {formatDay(customRange.endDate)}
          <button type="button" aria-label="Clear the custom range" onClick={() => dispatch(setPeriod(period))} className="ml-1 rounded-full p-0.5 hover:bg-white/20">
            <TbX size={14} aria-hidden="true" />
          </button>
        </span>
      ) : null}
      <Button size="sm" icon={TbCalendarEvent} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="custom-range">
        Custom range
      </Button>
      {open ? (
        <div id="custom-range" className="flex w-full flex-wrap items-end gap-3 rounded-2xl border border-hair bg-card p-4 sm:w-auto">
          <DateField label="From" value={draft.startDate} max={today()} invalid={touched && Boolean(problem)} onChange={(v) => setDraft((d) => ({ ...d, startDate: v }))} />
          <DateField label="To" value={draft.endDate} max={today()} invalid={touched && Boolean(problem)} onChange={(v) => setDraft((d) => ({ ...d, endDate: v }))} />
          <Button variant="primary" onClick={apply}>Apply</Button>
          {touched && problem ? <p role="alert" className="w-full text-[13px] font-medium text-bad">{problem}</p> : null}
          <p className="w-full text-[12.5px] text-ink-3">A custom range applies to the category breakdown. The summary uses the quick periods.</p>
        </div>
      ) : null}
    </div>
  );
}
