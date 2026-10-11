"use client";

/**
 * Filters for the full list: category, dates, sort and page size. They come from the
 * API's /filters endpoint, so a new category appears here without a code change.
 */
import { useDispatch, useSelector } from "react-redux";
import { RotateCcw } from "lucide-react";
import { useFilters } from "@/hooks/useSpendingApi";
import { resetTransactionFilters, selectPrefs, setTransactionFilter } from "@/store/preferencesSlice";
import Select from "@/components/ui/Select";
import DateField from "@/components/ui/DateField";
import Button from "@/components/ui/Button";

const SORTS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "amount_desc", label: "Largest first" },
  { value: "amount_asc", label: "Smallest first" },
];

export default function TransactionFilters() {
  const dispatch = useDispatch();
  const { customerId, transactions: f } = useSelector(selectPrefs);
  const { data } = useFilters(customerId);
  const set = (patch) => dispatch(setTransactionFilter(patch));
  const today = new Date().toISOString().slice(0, 10);
  const badRange = f.startDate && f.endDate && f.startDate > f.endDate;
  const active = f.category || f.startDate || f.endDate || f.sortBy !== "date_desc";

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.1fr_auto]">
        <Select label="Category" value={f.category} onChange={(v) => set({ category: v })}
          options={[{ value: "", label: "All categories" }, ...(data?.categories || []).map((c) => ({ value: c.name, label: c.name }))]} />
        <DateField label="From" value={f.startDate} max={f.endDate || today} invalid={badRange} onChange={(v) => set({ startDate: v })} />
        <DateField label="To" value={f.endDate} min={f.startDate || undefined} max={today} invalid={badRange} onChange={(v) => set({ endDate: v })} />
        <Select label="Sort by" value={f.sortBy} onChange={(v) => set({ sortBy: v })} options={SORTS} />
        <div className="flex items-end">
          <Button icon={RotateCcw} disabled={!active} onClick={() => dispatch(resetTransactionFilters())} className="w-full lg:w-auto">Clear</Button>
        </div>
      </div>
      {badRange ? <p role="alert" className="text-[13px] font-medium text-bad">The start date must be on or before the end date.</p> : null}
    </div>
  );
}
