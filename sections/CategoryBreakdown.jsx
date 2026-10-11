"use client";

/**
 * Where the money went: the donut and, beside it, the same figures as a list. Hovering
 * a slice highlights its row and the other way round. Choosing a row opens the
 * transactions for that category.
 */
import { useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { PieChart } from "lucide-react";
import { useCategories } from "@/hooks/useSpendingApi";
import { errorMessage } from "@/lib/apiClient";
import { selectPrefs, setTransactionFilter } from "@/store/preferencesSlice";
import Card from "@/components/ui/Card";
import Money from "@/components/ui/Money";
import Skeleton from "@/components/ui/Skeleton";
import { ErrorBlock, EmptyBlock } from "@/components/ui/States";
import CategoryIcon from "@/components/CategoryIcon";
import CategoryDonut from "@/components/charts/CategoryDonut";
import { formatDay } from "@/lib/format";

export default function CategoryBreakdown() {
  const dispatch = useDispatch();
  const { customerId, period, customRange } = useSelector(selectPrefs);
  const args = customRange ? { customerId, ...customRange } : { customerId, period };
  const { data, isLoading, isFetching, isError, error, refetch } = useCategories(args);
  const [active, setActive] = useState(null);

  const subtitle = data ? `${formatDay(data.dateRange.startDate)} – ${formatDay(data.dateRange.endDate)}` : " ";
  return (
    <Card title="Spending by category" subtitle={subtitle} aria-busy={isFetching || undefined}>
      {isError ? <ErrorBlock message={errorMessage(error)} onRetry={refetch} /> : isLoading || !data ? (
        <div className="grid items-center gap-6 md:grid-cols-[240px_1fr]">
          <Skeleton className="mx-auto h-[220px] w-[220px]" rounded="rounded-full" />
          <div className="space-y-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10" />)}</div>
        </div>
      ) : !data.categories.length ? (
        <EmptyBlock icon={PieChart} title="No spending in this period">Choose a longer period to see where your money went.</EmptyBlock>
      ) : (
        <div className={`grid items-center gap-6 md:grid-cols-[240px_1fr] ${isFetching ? "opacity-60 transition-opacity" : ""}`}>
          <div className="mx-auto w-full max-w-[240px]">
            <CategoryDonut categories={data.categories} total={data.totalAmount} activeName={active} onActive={setActive} />
          </div>
          <ul className="divide-y divide-hair" aria-label="Spending by category">
            {data.categories.map((c) => (
              <li key={c.name} onMouseEnter={() => setActive(c.name)} onMouseLeave={() => setActive(null)}>
                <Link
                  href="/transactions"
                  onClick={() => dispatch(setTransactionFilter({ category: c.name, startDate: data.dateRange.startDate, endDate: data.dateRange.endDate }))}
                  onFocus={() => setActive(c.name)}
                  onBlur={() => setActive(null)}
                  className={`flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors ${active === c.name ? "bg-card-muted" : ""}`}
                >
                  <CategoryIcon icon={c.icon} color={c.color} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[14.5px] font-semibold text-ink">{c.name}</span>
                      <Money amount={c.amount} className="text-[14.5px] font-semibold text-ink" />
                    </span>
                    <span className="mt-1.5 flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                        <span className="block h-full rounded-full" style={{ width: `${c.percentage}%`, background: c.color }} />
                      </span>
                      <span className="num w-[86px] shrink-0 text-right text-[12.5px] text-ink-3">{c.percentage}% · {c.transactionCount}</span>
                    </span>
                  </span>
                  <span className="sr-only">, {c.percentage} percent, {c.transactionCount} transactions. View transactions.</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
