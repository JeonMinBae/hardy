import { describe, expect, it } from "vitest";
import { countSolutions, randomSolvedGrid, solve } from "./solver";
import { MODES } from "./types";
import { getUnits } from "./units";
import { SAMPLE_PUZZLE, SAMPLE_SOLUTION, mulberry32, parseGrid } from "./testing";

const emptyGrid = () => Array<number>(81).fill(0);

describe("solver", () => {
  it("유일해 퍼즐은 1개, 해도 맞다", () => {
    const puzzle = parseGrid(SAMPLE_PUZZLE);
    expect(countSolutions(puzzle, "normal")).toBe(1);
    expect(solve(puzzle, "normal")).toEqual(parseGrid(SAMPLE_SOLUTION));
  });

  it("해가 여러 개면 limit 에서 멈춘다", () => {
    expect(countSolutions(emptyGrid(), "normal", 2)).toBe(2);
  });

  it("주어진 칸끼리 충돌하면 0", () => {
    const grid = emptyGrid();
    grid[0] = 5;
    grid[8] = 5; // 같은 0행
    expect(countSolutions(grid, "normal")).toBe(0);
  });

  it("대각선 충돌은 X 모드에서만 해가 없다", () => {
    const grid = emptyGrid();
    grid[0] = 5;
    grid[40] = 5; // (0,0)과 (4,4): 행·열·박스는 다르고 주대각선만 같다
    expect(countSolutions(grid, "normal")).toBe(2);
    expect(countSolutions(grid, "x")).toBe(0);
  });

  it("일반 해가 대각선 규칙을 어기면 X 모드에선 해가 없다", () => {
    expect(countSolutions(parseGrid(SAMPLE_PUZZLE), "x")).toBe(0);
  });

  it.each(MODES)("%s 무작위 완성판은 모든 단위를 만족한다", (mode) => {
    const grid = randomSolvedGrid(mode, mulberry32(1));
    for (const unit of getUnits(mode)) {
      expect(new Set(unit.map((i) => grid[i])).size).toBe(9);
    }
  });
});
