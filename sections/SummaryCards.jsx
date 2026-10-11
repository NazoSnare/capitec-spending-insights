"use client";

/** The four headline figures for the chosen period. */
import { useSelector } from "react-redux";
import { TbHash, TbReceipt, TbTrophy, TbWallet } from "react-icons/tb";
import { useSummary } from "@/hooks/useSpendingApi";
import { errorMessage } from "@/lib/apiClient";
import { selectPrefs } from "@/store/preferencesSlice";
import StatCard from "@/components/ui/StatCard";
import Money from "@/components/ui/Money";
import Delta from "@/components/ui/Delta";
import Skeleton from "@/components/ui/Skeleton";
import { ErrorBlock } from "@/components/ui/States";
import { comparedLabel } from "@/lib/periods";

export default function SummaryCards() {
  const { customerId, period } = useSelector(selectPrefs);
  const { data, isLoading, isError, error, refetch } = useSummary({ customerId, period });

  if (isError) return <ErrorBlock message={errorMessage(error)} onRetry={refetch} />;
  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Loading the summary">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[132px]" rounded="rounded-[18px]" />)}
      </div>
    );
  }
  const vs = comparedLabel(data.period);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard emphasis label="Total spent" icon={TbWallet} value={<Money amount={data.totalSpent} />}
        footer={<Delta inverse value={data.comparedToPrevious.spentChange} goodWhen="down" label={vs} />} />
      <StatCard label="Transactions" icon={TbHash} value={<span className="num">{data.transactionCount}</span>}
        footer={<Delta value={data.comparedToPrevious.transactionChange} goodWhen="down" label={vs} />} />
      <StatCard label="Average transaction" icon={TbReceipt} value={<Money amount={data.averageTransaction} />}
        footer={<span className="text-[12.5px] text-ink-3">Per purchase in this period</span>} />
      <StatCard label="Top category" icon={TbTrophy} value={data.topCategory || "—"}
        footer={<span className="text-[12.5px] text-ink-3">Where most of the money went</span>} />
    </div>
  );
}
