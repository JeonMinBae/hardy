import { describe, expect, it } from "vitest";
import { cellBackground, type BackgroundContext } from "./display";
import { SAMPLE_PUZZLE, parseGrid } from "./testing";

const board = parseGrid(SAMPLE_PUZZLE); // 0번 칸 5, 1번 칸 3, 2번 칸 빈칸
const noGreen = Array<boolean>(81).fill(false);
const ctx = (over: Partial<BackgroundContext>): BackgroundContext => ({
  board,
  mode: "normal",
  selected: null,
  completed: noGreen,
  ...over,
});

describe("cellBackground", () => {
  it("선택 칸은 초록보다 앞선다", () => {
    expect(cellBackground(0, ctx({ selected: 0, completed: Array(81).fill(true) }))).toBe("selected");
  });

  it("같은 숫자 칸을 강조하고, 빈칸끼리는 같은 숫자로 보지 않는다", () => {
    // 0번 칸(5)과 같은 5 가 14번 칸 (1, 5)에 있고, 둘은 피어가 아니다
    expect(cellBackground(14, ctx({ selected: 0 }))).toBe("sameNumber");
    expect(cellBackground(3, ctx({ selected: 2 }))).toBe("related");
  });

  it("관련 칸은 초록보다 앞선다", () => {
    expect(cellBackground(8, ctx({ selected: 0, completed: Array(81).fill(true) }))).toBe("related");
  });

  it("대각선 위 칸을 고르면 X 모드에서만 그 대각선이 관련 칸", () => {
    expect(cellBackground(80, ctx({ selected: 0, mode: "x" }))).toBe("related");
    expect(cellBackground(80, ctx({ selected: 0 }))).toBe("none");
  });

  it("초록은 대각선 음영보다 앞서고, 대각선 음영은 X 모드에만", () => {
    const green = Array<boolean>(81).fill(false);
    green[80] = true;
    expect(cellBackground(80, ctx({ mode: "x", completed: green }))).toBe("completed");
    expect(cellBackground(70, ctx({ mode: "x" }))).toBe("diagonal");
    expect(cellBackground(70, ctx({}))).toBe("none");
  });
});
