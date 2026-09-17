import { describe, expect, it } from "vitest";
import { puzzleNumber, secondsUntilNextPuzzle } from "./daily";

describe("puzzleNumber", () => {
  it.each([
    ["2026-09-17T00:00:00+09:00", 1],
    ["2026-09-17T23:59:59.999+09:00", 1],
    ["2026-09-18T00:00:00+09:00", 2],
    ["2027-09-17T00:00:00+09:00", 366],
    ["2026-09-16T23:59:59+09:00", 1], // 기준일 이전 시계
    ["2020-01-01T00:00:00+09:00", 1],
  ])("%s → %i번", (iso, puzzle) => {
    expect(puzzleNumber(Date.parse(iso))).toBe(puzzle);
  });

  it("같은 순간이면 어느 시간대 표기든 한국 날짜로 번호를 정한다", () => {
    // 뉴욕 기준으로는 아직 9월 17일이지만 한국은 18일 0시다
    expect(puzzleNumber(Date.parse("2026-09-17T11:00:00-04:00"))).toBe(2);
    expect(puzzleNumber(Date.parse("2026-09-17T15:00:00Z"))).toBe(2);
  });

  it("기기 시간대를 바꿔도 같은 순간이면 같은 번호", () => {
    // Windows 의 Node 는 TZ 를 지워도 시스템 시간대로 돌아가지 않아, 원래 시간대 이름을 잡아 두고 되돌린다
    const original = process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const instant = Date.parse("2026-09-17T15:00:00Z"); // 한국 18일 0시, 뉴욕 17일 11시
    try {
      for (const [tz, localHour] of [["America/New_York", 11], ["Asia/Seoul", 0], ["UTC", 15]] as const) {
        process.env.TZ = tz;
        // 시간대 전환이 실제로 적용됐는지 먼저 확인한다(안 되면 이 테스트는 아무것도 검증하지 않는다)
        expect(new Date(instant).getHours()).toBe(localHour);
        expect(puzzleNumber(instant)).toBe(2);
      }
    } finally {
      process.env.TZ = original;
    }
  });
});

describe("secondsUntilNextPuzzle", () => {
  it.each([
    ["2026-09-17T23:59:59+09:00", 1],
    ["2026-09-17T23:59:59.500+09:00", 1],
    ["2026-09-18T00:00:00+09:00", 86400],
    ["2026-09-17T12:00:00+09:00", 43200],
  ])("%s → %i초", (iso, seconds) => {
    expect(secondsUntilNextPuzzle(Date.parse(iso))).toBe(seconds);
  });
});
