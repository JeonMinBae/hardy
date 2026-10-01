import { describe, expect, it } from "vitest";
import { parseCubeSearch } from "./url";
import { faceMove } from "./notation";
import { dailyShareText, dailyUrl, practiceShareUrl } from "./share";

describe("dailyShareText", () => {
  it("성공", () => {
    expect(dailyShareText(3, 12, { seconds: 102, moves: 38 }, "URL")).toBe("hardy 큐브 3×3 #12\n⏱ 01:42 · 38수\n\nURL");
  });
  it("포기", () => {
    expect(dailyShareText(2, 3, "lost", "URL")).toBe("hardy 큐브 2×2 #3\n포기\n\nURL");
  });
});

it("dailyUrl 은 그 크기 데일리 주소", () => {
  expect(dailyUrl("https://h.test", 2)).toBe("https://h.test/cube?d=2");
});

it("practiceShareUrl 은 같은 섞기를 처음부터 시작한다", () => {
  const scramble = [faceMove("F", false, 3)];
  const url = new URL(practiceShareUrl("https://h.test", 3, scramble));
  expect(parseCubeSearch(url.searchParams)).toEqual({ kind: "practice", snapshot: { size: 3, scramble, history: [], moveCount: 0, elapsed: 0 } });
});
