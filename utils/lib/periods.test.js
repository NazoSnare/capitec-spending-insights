import { describe, expect, it } from "vitest";
import { periodOptions } from "./periods";
import { DATE_RANGE_PRESETS } from "@/server/catalogue";

describe("periodOptions", () => {
  it("builds the period buttons from the API's presets, shortening the labels", () => {
    expect(periodOptions(DATE_RANGE_PRESETS)).toEqual([
      { value: "7d", label: "7 days", title: "Last 7 days" },
      { value: "30d", label: "30 days", title: "Last 30 days" },
      { value: "90d", label: "90 days", title: "Last 90 days" },
      { value: "1y", label: "1 year", title: "Last year" },
    ]);
  });
  it("falls back to the built-in list until the presets arrive", () => {
    expect(periodOptions(undefined).map((o) => o.value)).toEqual(["7d", "30d", "90d", "1y"]);
  });
});
