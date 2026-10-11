"use client";

/** Every transaction, filterable. */
import TransactionFilters from "@/components/sections/TransactionFilters";
import TransactionList from "@/components/sections/TransactionList";

export default function TransactionsContainer() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-ink">Transactions</h1>
        <p className="mt-1 text-[14px] text-ink-3">Filter by category and dates, and sort by date or amount.</p>
      </div>
      <TransactionFilters />
      <TransactionList />
    </div>
  );
}
