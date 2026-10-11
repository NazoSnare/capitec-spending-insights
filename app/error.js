"use client";

/** A rendering error anywhere below the layout lands here instead of a blank page. */
import { ErrorBlock } from "@/components/ui/States";

export default function Error({ reset }) {
  return <ErrorBlock message="This page ran into a problem. Your data is safe." onRetry={reset} />;
}
