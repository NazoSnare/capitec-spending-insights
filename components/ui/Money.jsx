"use client";

/**
 * A rand amount. Respects "hide amounts": the figure is replaced on screen and for
 * screen readers alike, because hiding it visually but reading it aloud defeats the
 * point when somebody is beside you.
 */
import { useSelector } from "react-redux";
import { selectHideAmounts } from "@/store/preferencesSlice";
import { formatZAR } from "@/lib/format";

export default function Money({ amount, cents = true, sign = false, className = "" }) {
  const hidden = useSelector(selectHideAmounts);
  if (hidden) return <span className={`num ${className}`} aria-label="Amount hidden">R ••••</span>;
  return <span className={`num ${className}`}>{formatZAR(amount, { cents, sign })}</span>;
}
