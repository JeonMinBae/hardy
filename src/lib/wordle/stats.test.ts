import { describe, expect, it } from "vitest";
import type { Mark } from "./evaluate";
import { computeStats, recordResult, shareText, type Results } from "./stats";

describe("computeStats", () => {
  it("기록이 없으면 모두 0", () => {
    expect(computeStats({}, 10)).toEqual({ played: 0, winRate: 0, currentStreak: 0, maxStreak: 0, distribution: [0, 0, 0, 0, 0, 0, 0, 0] });
  });

  it("플레이 수는 성공+실패, 승률은 반올림, 분포는 성공한 시도 수별", () => {
    expect(computeStats({ 1: 1, 2: "lost", 3: 2 }, 3)).toMatchObject({ played: 3, winRate: 67, distribution: [1, 1, 0, 0, 0, 0, 0, 0] });
  });

  const STREAK_CASES: [string, Results, number][] = [
    ["오늘 성공했으면 오늘부터 센다", { 8: 2, 9: 3, 10: 4 }, 3],
    ["오늘 아직 안 풀었으면 어제부터 센다", { 8: 2, 9: 3 }, 2],
    ["어제도 오늘도 성공하지 않았으면 0", { 8: 2 }, 0],
    ["실패하면 끊긴다", { 8: 2, 9: "lost", 10: 4 }, 1],
    ["오늘 실패했으면 어제까지 성공했어도 0", { 8: 2, 9: 3, 10: "lost" }, 0],
    ["빠진 날이 있으면 끊긴다", { 7: 1, 9: 3, 10: 4 }, 2],
  ];
  it.each(STREAK_CASES)("현재 연속: %s", (_, results, streak) => {
    expect(computeStats(results, 10).currentStreak).toBe(streak);
  });

  it("최장 연속은 번호가 이어진 성공 구간 중 가장 긴 길이", () => {
    expect(computeStats({ 1: 1, 2: 2, 3: 3, 4: "lost", 6: 1, 7: 1 }, 7).maxStreak).toBe(3);
  });
});

it("recordResult 는 원래 기록을 바꾸지 않고 새 기록을 돌려준다", () => {
  const results: Results = { 1: 3 };
  expect(recordResult(results, 2, "lost")).toEqual({ 1: 3, 2: "lost" });
  expect(results).toEqual({ 1: 3 });
});

describe("shareText", () => {
  const miss: Mark[] = ["correct", "absent", "present", "absent", "absent", "absent", "absent"];
  const hit: Mark[] = Array(7).fill("correct");

  it("성공이면 시도 수, 문제 번호와 정답 글자 없이 색 칸만. 빈 줄 뒤 마지막 줄은 접속 주소", () => {
    expect(shareText([miss, hit], true, "URL")).toBe("hardy 워들 2/8\n\n🟩⬜🟨⬜⬜⬜⬜\n🟩🟩🟩🟩🟩🟩🟩\n\nURL");
  });

  it("실패면 X/8", () => {
    expect(shareText(Array(8).fill(miss), false, "URL").split("\n")[0]).toBe("hardy 워들 X/8");
  });
});
