"use client";

/**
 * Month by month. A chart for seeing the shape, and the same figures as a table for
 * reading exact amounts and for screen readers; the customer chooses which.
 */
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TbChartBar, TbTable } from "react-icons/tb";
import { useTrends } from "@/hooks/useSpendingApi";
import { errorMessage } from "@/lib/apiClient";
import { selectPrefs, setTrendMonths } from "@/store/preferencesSlice";
import Card from "@/components/ui/Card";
import Money from "@/components/ui/Money";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Skeleton from "@/components/ui/Skeleton";
import { ErrorBlock, EmptyBlock } from "@/components/ui/States";
import SpendingTrendChart from "@/components/charts/SpendingTrendChart";
import { formatMonth } from "@/lib/format";

export default function TrendSection() {
  const dispatch = useDispatch();
  const { customerId, trendMonths } = useSelector(selectPrefs);
  const { data, isLoading, isError, error, refetch } = useTrends({ customerId, months: trendMonths });
  const [view, setView] = useState("chart");

  const action = (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl size="sm" label="Months shown" value={String(trendMonths)} onChange={(v) => dispatch(setTrendMonths(v))}
        options={[{ value: "6", label: "6m" }, { value: "12", label: "12m" }, { value: "24", label: "24m" }]} />
      <SegmentedControl size="sm" label="Show as" value={view} onChange={setView}
        options={[{ value: "chart", label: <span className="inline-flex items-center gap-1"><TbChartBar size={14} aria-hidden="true" />Chart</span> }, { value: "table", label: <span className="inline-flex items-center gap-1"><TbTable size={14} aria-hidden="true" />Table</span> }]} />
    </div>
  );

  return (
    <Card title="Monthly spending" subtitle="The current month is shown lighter until it ends. The dashed line is your average month." action={action}>
      {isError ? <ErrorBlock message={errorMessage(error)} onRetry={refetch} /> : isLoading || !data ? (
        <Skeleton className="h-[240px]" />
      ) : !data.trends.some((t) => t.transactionCount) ? (
        <EmptyBlock icon={TbChartBar} title="No spending yet">Monthly totals appear once you start using your account.</EmptyBlock>
      ) : view === "chart" ? (
        <SpendingTrendChart trends={data.trends} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-[14px]">
            <caption className="sr-only">Monthly spending</caption>
            <thead className="bg-card-muted text-[12.5px] uppercase tracking-[0.06em] text-ink-3">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">Month</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Spent</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Transactions</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {[...data.trends].reverse().map((t) => (
                <tr key={t.month}>
                  <th scope="row" className="px-3 py-2.5 font-medium text-ink">{formatMonth(t.month)}{t.partial ? <span className="ml-2 text-[12px] font-normal text-ink-3">so far</span> : null}</th>
                  <td className="px-3 py-2.5 text-right"><Money amount={t.totalSpent} /></td>
                  <td className="num px-3 py-2.5 text-right">{t.transactionCount}</td>
                  <td className="px-3 py-2.5 text-right"><Money amount={t.averageTransaction} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
