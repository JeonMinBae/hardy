import { describe, expect, it } from "vitest";
import { lockAxis, strokeCells, strokeTarget } from "./stroke";
import { CROSSED, EMPTY, FILLED } from "./types";

describe("strokeTarget", () => {
  it.each([
    ["fill", EMPTY, FILLED],
    ["fill", FILLED, EMPTY],
    ["fill", CROSSED, FILLED],
    ["cross", EMPTY, CROSSED],
    ["cross", CROSSED, EMPTY],
    ["cross", FILLED, CROSSED],
  ] as const)("%s 모드, 시작 칸 %i → %i", (mode, start, target) => {
    expect(strokeTarget(mode, start)).toBe(target);
  });
});

describe("lockAxis", () => {
  // 10×10 에서 시작 칸 (2, 3) = 23
  it.each([
    [2, 3, null], // 아직 시작 칸
    [2, 4, "row"],
    [5, 3, "col"],
    [3, 4, "row"], // 대각선 첫 이동은 가로 우선
    [4, 4, "col"],
    [2, -5, "row"], // 판 밖이어도 방향은 정한다
  ] as const)("(%i, %i) → %s", (row, col, axis) => {
    expect(lockAxis(10, 23, row, col)).toBe(axis);
  });
});

describe("strokeCells", () => {
  it("빠르게 움직여도 시작 칸부터 투영 칸까지 사이 칸을 모두 포함한다", () => {
    expect(strokeCells(10, 23, "row", 2, 7)).toEqual([23, 24, 25, 26, 27]);
    expect(strokeCells(10, 23, "row", 2, 0)).toEqual([20, 21, 22, 23]);
    expect(strokeCells(10, 23, "col", 5, 3)).toEqual([23, 33, 43, 53]);
  });

  it("고정 방향과 다른 축의 움직임은 무시하고 투영한다", () => {
    expect(strokeCells(10, 23, "row", 6, 5)).toEqual([23, 24, 25]);
  });

  it("판 밖 좌표는 가장자리까지로 제한한다", () => {
    expect(strokeCells(10, 23, "row", 2, 42)).toEqual([23, 24, 25, 26, 27, 28, 29]);
    expect(strokeCells(10, 23, "col", -3, 3)).toEqual([3, 13, 23]);
  });
});
