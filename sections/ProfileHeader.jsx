"use client";

/** Who this is: the greeting, the account and what they have spent since joining. */
import { BadgeCheck } from "lucide-react";
import { useSelector } from "react-redux";
import { useProfile } from "@/hooks/useSpendingApi";
import { errorMessage } from "@/lib/apiClient";
import { selectCustomerId } from "@/store/preferencesSlice";
import Badge from "@/components/ui/Badge";
import Money from "@/components/ui/Money";
import Skeleton from "@/components/ui/Skeleton";
import { ErrorBlock } from "@/components/ui/States";
import { formatDay, humanise } from "@/lib/format";

const greeting = (h = new Date().getHours()) => (h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");

export default function ProfileHeader() {
  const customerId = useSelector(selectCustomerId);
  const result = useProfile(customerId);
  const { data, isLoading, isError, error, refetch } = result;

  if (isError) return <ErrorBlock message={errorMessage(error)} onRetry={refetch} />;
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[14px] font-medium text-ink-3">{greeting()}</p>
        {isLoading ? <Skeleton className="mt-1 h-8 w-64" /> : (
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-ink">{data.name.split(" ")[0]}, here is your spending</h1>
        )}
        {data ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[13.5px] text-ink-3">
            <Badge tone="info" icon={BadgeCheck}>{humanise(data.accountType)} account</Badge>
            <span>Client since {formatDay(data.joinDate)}</span>
          </div>
        ) : null}
      </div>
      {data ? (
        <div className="text-right">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">Spent since joining</p>
          <p className="text-[20px] font-bold text-ink"><Money amount={data.totalSpent} /></p>
        </div>
      ) : null}
    </div>
  );
}
