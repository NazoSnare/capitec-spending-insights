import { describe, expect, it } from "vitest";
import { formatChange, formatDate, formatDay, formatMonth, formatZAR, formatZARShort, humanise } from "./format";

describe("formatZAR", () => {
  it("writes rands the way a South African statement does", () => {
    expect(formatZAR(4275.1)).toBe("R4 275.10");
    expect(formatZAR(1250000)).toBe("R1 250 000.00");
    expect(formatZAR(83.8)).toBe("R83.80");
    expect(formatZAR(-61.34)).toBe("-R61.34");
    expect(formatZAR(12, { sign: true })).toBe("+R12.00");
    expect(formatZAR(999.5, { cents: false })).toBe("R1 000");
  });
  it("shows a dash rather than R0.00 when there is no figure", () => {
    expect(formatZAR(null)).toBe("—");
    expect(formatZAR(undefined)).toBe("—");
    expect(formatZAR("abc")).toBe("—");
  });
  it("shortens axis labels", () => {
    expect(formatZARShort(4300)).toBe("R4.3k");
    expect(formatZARShort(1_200_000)).toBe("R1.2m");
    expect(formatZARShort(400)).toBe("R400");
    expect(formatZARShort(5000)).toBe("R5k");
  });
});

describe("dates and changes", () => {
  it("formats in South African time, without a leading zero or 'Sept'", () => {
    // 22:30 UTC on the 30th is already 1 October in Johannesburg.
    expect(formatDate("2026-09-30T22:30:00Z")).toBe("1 Oct 2026");
    expect(formatDate("2026-09-29T08:31:00Z", { withTime: true })).toBe("29 Sep 2026, 10:31");
    expect(formatDate("not a date")).toBe("—");
  });
  it("formats days, months, changes and labels", () => {
    expect(formatDay("2026-09-05")).toBe("5 Sep 2026");
    expect(formatMonth("2026-10")).toBe("Oct 2026");
    expect(formatMonth("2026-10", { short: true })).toBe("Oct");
    expect(formatChange(12.5)).toBe("+12.5%");
    expect(formatChange(-3)).toBe("-3%");
    expect(formatChange(null)).toBe("—");
    expect(humanise("on_track")).toBe("On track");
  });
});
