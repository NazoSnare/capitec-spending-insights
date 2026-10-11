/** The Capitec mark and wordmark, with the product name beside it. */
import Image from "next/image";

export default function Logo({ product = "Spending Insights", inverse = false }) {
  return (
    <span className="flex items-center gap-3">
      <span className={`rounded-lg px-1.5 py-1 ${inverse ? "bg-white" : ""}`}>
        <Image src="/capitec-logo.svg" alt="Capitec" width={124} height={18} priority />
      </span>
      {product ? (
        <span className={`hidden border-l pl-3 text-[14px] font-semibold sm:inline ${inverse ? "border-white/25 text-white" : "border-hair text-ink-2"}`}>{product}</span>
      ) : null}
    </span>
  );
}
