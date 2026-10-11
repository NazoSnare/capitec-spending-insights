"use client";

/** The latest few transactions, with a way into the full list. */
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Receipt } from "lucide-react";
import { useTransactions } from "@/hooks/useSpendingApi";
import { errorMessage } from "@/lib/apiClient";
import { resetTransactionFilters, selectCustomerId } from "@/store/preferencesSlice";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { ErrorBlock, EmptyBlock } from "@/components/ui/States";
import TransactionRow from "@/components/TransactionRow";

export default function RecentTransactions({ count = 6 }) {
  const dispatch = useDispatch();
  const customerId = useSelector(selectCustomerId);
  const { data, isLoading, isError, error, refetch } = useTransactions({ customerId, limit: count, sortBy: "date_desc" });

  const action = (
    <Link href="/transactions" onClick={() => dispatch(resetTransactionFilters())}
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[13.5px] font-semibold text-navy hover:bg-sky-soft">
      View all <ArrowRight size={15} aria-hidden="true" />
    </Link>
  );

  return (
    <Card title="Recent transactions" action={action}>
      {isError ? <ErrorBlock message={errorMessage(error)} onRetry={refetch} /> : isLoading || !data ? (
        <div className="space-y-4">{Array.from({ length: count }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : !data.transactions.length ? (
        <EmptyBlock icon={Receipt} title="No transactions yet" />
      ) : (
        <ul className="-my-3 divide-y divide-hair">{data.transactions.map((t) => <TransactionRow key={t.id} t={t} compact />)}</ul>
      )}
    </Card>
  );
}
