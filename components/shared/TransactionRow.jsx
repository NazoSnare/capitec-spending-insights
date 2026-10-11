/**
 * One transaction: the category icon, the merchant and what it was, when and how it
 * was paid, and the amount. Shared by the dashboard's recent list and the full list,
 * so both read the same.
 */
import CategoryIcon from "./CategoryIcon";
import Money from "@/components/ui/Money";
import { formatDate } from "@/utils/lib/format";

export default function TransactionRow({ t, compact = false }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <CategoryIcon icon={t.icon} color={t.categoryColor} size={compact ? 36 : 40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold text-ink">{t.merchant}</p>
        <p className="truncate text-[12.5px] text-ink-3">
          {t.description} · {t.category}{compact ? "" : ` · ${t.paymentMethod}`}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {/* Spending is money out, so it is shown as a debit. */}
        <Money amount={-t.amount} className="text-[14.5px] font-semibold text-ink" />
        <p className="text-[12px] text-ink-3"><time dateTime={t.date}>{formatDate(t.date, { withTime: !compact })}</time></p>
      </div>
    </li>
  );
}
