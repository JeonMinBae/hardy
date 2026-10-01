import { describe, expect, it } from "vitest";
import { dailyNumber, secondsUntilSeoulMidnight } from "./daily";

const FIRST = Date.UTC(2026, 9, 1);

describe("dailyNumber", () => {
  it.each([
    ["2026-10-01T00:00:00+09:00", 1],
    ["2026-10-01T23:59:59+09:00", 1],
    ["2026-10-02T00:00:00+09:00", 2],
    // 기기가 UTC 여도 한국 날짜 기준. UTC 10-01 15:00 = 한국 10-02 00:00
    ["2026-10-01T15:00:00Z", 2],
    ["2026-09-01T00:00:00+09:00", 1],
  ])("%s → %i", (iso, n) => {
    expect(dailyNumber(Date.parse(iso), FIRST)).toBe(n);
  });
});

it("자정 1초 전이면 1초 남는다", () => {
  expect(secondsUntilSeoulMidnight(Date.parse("2026-10-01T23:59:59+09:00"))).toBe(1);
});
