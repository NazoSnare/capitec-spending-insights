"use client";

/**
 * The rendered width of an element, kept up to date as it resizes.
 *
 * Victory draws at a fixed width and scales the whole SVG, so on a phone a 640-wide
 * chart shrank its 11px labels to about 5px. Drawing at the real width keeps the text
 * at its real size.
 */
import { useEffect, useRef, useState } from "react";

export default function useElementWidth(fallback = 640) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}
