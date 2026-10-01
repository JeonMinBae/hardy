import { describe, expect, it } from "vitest";
import { summarizeDaily } from "./streak";

type R = "win" | "lost";
const isWin = (r: R) => r === "win";

describe("summarizeDaily", () => {
  it("기록이 없으면 모두 0", () => {
    expect(summarizeDaily<R>({}, 5, isWin)).toEqual({ played: 0, winRate: 0, currentStreak: 0, maxStreak: 0 });
  });

  it.each<[string, Record<number, R>, number]>([
    ["오늘 성공이면 오늘부터", { 3: "win", 4: "win", 5: "win" }, 3],
    ["오늘 미기록이면 어제부터", { 3: "win", 4: "win" }, 2],
    ["오늘 실패면 0", { 4: "win", 5: "lost" }, 0],
    ["빠진 날에서 끊긴다", { 2: "win", 4: "win", 5: "win" }, 2],
  ])("현재 연속: %s", (_, results, streak) => {
    expect(summarizeDaily(results, 5, isWin).currentStreak).toBe(streak);
  });

  it("승률은 반올림, 최장 연속은 이어진 성공 구간 최대", () => {
    expect(summarizeDaily<R>({ 1: "win", 2: "win", 3: "lost", 4: "win" }, 4, isWin)).toMatchObject({ played: 4, winRate: 75, maxStreak: 2 });
  });
});
