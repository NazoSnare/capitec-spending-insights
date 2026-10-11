"use client";

/**
 * Scroll to the top when the customer moves to another page.
 *
 * The app shell stays mounted between pages, so the browser keeps the old scroll
 * position: choosing a category halfway down the overview opened Transactions halfway
 * down too, past its filters. A new page now starts at the top.
 *
 * Back and Forward are left alone. There the browser's own restoration is what people
 * expect: going back to the overview returns to the category they clicked.
 *
 * Smooth unless the customer has asked their device to reduce motion.
 */
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function useScrollToTopOnNavigate() {
  const path = usePathname();
  const first = useRef(true);
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPop = () => { fromHistory.current = true; };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    // Nothing to do on the first render: the page opens at the top anyway, and a reload
    // keeps the browser's restored position.
    if (first.current) { first.current = false; return; }
    if (fromHistory.current) { fromHistory.current = false; return; }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, left: 0, behavior: reduce ? "auto" : "smooth" });
  }, [path]);
}
