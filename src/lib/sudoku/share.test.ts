import { describe, expect, it } from "vitest";
import { shareText, shareUrl } from "./share";
import type { Snapshot } from "./types";
import { parseGameSearch } from "./url";
import { SAMPLE_PUZZLE, parseGrid } from "./testing";

const ORIGIN = "https://hardy.test";
const sample = (over: Partial<Snapshot> = {}): Snapshot => ({
  mode: "normal",
  difficulty: "medium",
  givens: parseGrid(SAMPLE_PUZZLE),
  values: Array(81).fill(0),
  hints: Array(81).fill(false),
  notes: Array(81).fill(0),
  elapsed: 0,
  ...over,
});

describe("shareText", () => {
  it("푸는 중이면 기록 없이 문제와 링크만", () => {
    expect(shareText(sample(), "URL", null)).toBe("hardy 스도쿠 일반 · 중급\n\nURL");
  });

  it("완성이면 시간과 힌트 횟수를 한 줄 더", () => {
    const hints = Array(81).fill(false);
    hints[0] = hints[1] = true;
    expect(shareText(sample({ mode: "x", difficulty: "hard", hints }), "URL", 754)).toBe("hardy 스도쿠 X · 고급\n12:34 · 힌트 2회\n\nURL");
  });

  it("힌트를 한 번도 안 썼어도 0회로 적는다", () => {
    expect(shareText(sample(), "URL", 0).split("\n")[1]).toBe("00:00 · 힌트 0회");
  });
});

describe("shareUrl", () => {
  it("입력·메모·경과 시간을 지운 같은 문제 링크", () => {
    const values = Array(81).fill(0);
    values[2] = 4;
    const notes = Array(81).fill(0);
    notes[3] = 0b101;

    const url = shareUrl(ORIGIN, sample({ values, notes, elapsed: 600 }));
    expect(url.startsWith(`${ORIGIN}/sudoku?`)).toBe(true);

    const parsed = parseGameSearch(new URLSearchParams(url.split("?")[1]));
    if (parsed.kind !== "restore") throw new Error(`restore 링크여야 한다: ${parsed.kind}`);
    expect(parsed.snapshot).toMatchObject({ mode: "normal", difficulty: "medium", elapsed: 0 });
    expect(parsed.snapshot.givens).toEqual(parseGrid(SAMPLE_PUZZLE));
    expect(parsed.snapshot.values.every((v) => v === 0)).toBe(true);
    expect(parsed.snapshot.notes.every((n) => n === 0)).toBe(true);
  });
});
