"use client";

/**
 * The frame every page sits in: the Capitec header, the two pages, the customer
 * switcher (this is mock data, so there is more than one customer to look at) and the
 * "hide amounts" switch.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { TbEye, TbEyeOff } from "react-icons/tb";
import Logo from "@/components/Logo";
import { selectPrefs, setCustomer, toggleHideAmounts } from "@/store/preferencesSlice";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
];

const CUSTOMERS = [
  { id: "12345", label: "Thandiwe Mokoena" },
  { id: "67890", label: "Sipho Dlamini" },
];

export default function AppShell({ children }) {
  const path = usePathname();
  const dispatch = useDispatch();
  const { customerId, hideAmounts } = useSelector(selectPrefs);

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-semibold">
        Skip to content
      </a>
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Spending Insights home"><Logo inverse /></Link>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="customer">Customer</label>
            <select
              id="customer"
              value={customerId}
              onChange={(e) => dispatch(setCustomer(e.target.value))}
              className="h-9 max-w-[180px] rounded-full border border-white/25 bg-white/10 px-3 text-[13.5px] font-medium text-white outline-none focus:border-white"
            >
              {CUSTOMERS.map((c) => <option key={c.id} value={c.id} className="text-ink">{c.label}</option>)}
            </select>
            <button
              type="button"
              onClick={() => dispatch(toggleHideAmounts())}
              aria-pressed={hideAmounts}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-white/25 px-3 text-[13.5px] font-medium hover:bg-white/10"
            >
              {hideAmounts ? <TbEyeOff size={16} aria-hidden="true" /> : <TbEye size={16} aria-hidden="true" />}
              <span className="hidden sm:inline">{hideAmounts ? "Show amounts" : "Hide amounts"}</span>
              <span className="sr-only sm:hidden">{hideAmounts ? "Show amounts" : "Hide amounts"}</span>
            </button>
          </div>
        </div>
        <nav aria-label="Main" className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <ul className="flex gap-1">
            {NAV.map((n) => {
              const on = n.href === "/" ? path === "/" : path.startsWith(n.href);
              return (
                <li key={n.href}>
                  <Link href={n.href} aria-current={on ? "page" : undefined}
                    className={`inline-block border-b-[3px] px-3 pb-2.5 pt-1 text-[14px] font-semibold transition-colors ${on ? "border-brand-red text-white" : "border-transparent text-white/70 hover:text-white"}`}>
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <footer className="mx-auto max-w-[1240px] px-4 pb-8 text-[12.5px] text-ink-3 sm:px-6">
        Built for the Capitec Software Engineer (Front-End) assessment. Every customer, amount and transaction here is fictional.
      </footer>
    </div>
  );
}
