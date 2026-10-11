"use client";

/** The full, filtered, paged list of transactions. */
import { useDispatch, useSelector } from "react-redux";
import { TbSearchOff } from "react-icons/tb";
import { useTransactions } from "@/hooks/useSpendingApi";
import { errorMessage } from "@/lib/apiClient";
import { resetTransactionFilters, selectPrefs, setTransactionFilter, setTransactionPage } from "@/store/preferencesSlice";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { ErrorBlock, EmptyBlock } from "@/components/ui/States";
import TransactionRow from "@/components/TransactionRow";

export default function TransactionList() {
  const dispatch = useDispatch();
  const { customerId, transactions: f } = useSelector(selectPrefs);
  const badRange = f.startDate && f.endDate && f.startDate > f.endDate;
  // A half-entered range is not sent: only a complete one filters.
  const range = f.startDate && f.endDate && !badRange ? { startDate: f.startDate, endDate: f.endDate } : {};
  const { data, isLoading, isFetching, isError, error, refetch } = useTransactions(
    { customerId, limit: f.pageSize, offset: f.page * f.pageSize, category: f.category, sortBy: f.sortBy, ...range },
    { enabled: !badRange },
  );

  const sizes = (
    <Select hideLabel label="Per page" value={String(f.pageSize)} onChange={(v) => dispatch(setTransactionFilter({ pageSize: Number(v) }))}
      options={[10, 20, 50, 100].map((n) => ({ value: String(n), label: `${n} per page` }))} />
  );

  return (
    <Card title="Transactions" subtitle={data ? `${data.pagination.total.toLocaleString("en-ZA")} found` : " "} action={sizes} aria-busy={isFetching || undefined}>
      {isError ? <ErrorBlock message={errorMessage(error)} onRetry={refetch} /> : isLoading || (!data && !badRange) ? (
        <div className="space-y-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
      ) : !data?.transactions.length ? (
        <EmptyBlock icon={TbSearchOff} title="No transactions match">
          Try another category or a wider date range.{" "}
          <Button size="sm" variant="ghost" onClick={() => dispatch(resetTransactionFilters())}>Clear filters</Button>
        </EmptyBlock>
      ) : (
        <>
          <ul className={`-my-1 divide-y divide-hair ${isFetching ? "opacity-60 transition-opacity" : ""}`}>
            {data.transactions.map((t) => <TransactionRow key={t.id} t={t} />)}
          </ul>
          <div className="mt-4 border-t border-hair pt-4">
            <Pagination offset={data.pagination.offset} limit={data.pagination.limit} total={data.pagination.total}
              onPage={(p) => { dispatch(setTransactionPage(p)); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          </div>
        </>
      )}
    </Card>
  );
}
