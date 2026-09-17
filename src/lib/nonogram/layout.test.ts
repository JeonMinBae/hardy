import { describe, expect, it } from "vitest";
import { clueDepth, clueSlot, fitCellSize, MAX_CELL } from "./layout";

describe("fitCellSize", () => {
  it.each([
    // 360px 화면(좌우 여백 16px씩) 20×20, 행 단서 최대 5개
    [328, 20, 5, 13],
    // 672px 화면 20×20
    [640, 20, 5, 26],
    // 넓은 화면의 작은 판은 상한에서 멈춘다
    [640, 10, 3, MAX_CELL],
    [5, 20, 5, 1],
  ])("폭 %ipx, %i칸, 단서 %i개 → %ipx", (width, size, depth, cell) => {
    expect(fitCellSize(width, size, depth)).toBe(cell);
  });

  it("칸과 단서 영역의 합이 폭을 넘지 않는다", () => {
    for (let width = 200; width <= 700; width += 7) {
      for (const [size, depth] of [[10, 3], [15, 5], [20, 7]]) {
        const cell = fitCellSize(width, size, depth);
        if (cell > 1) expect(cell * size + clueSlot(cell) * depth).toBeLessThanOrEqual(width);
      }
    }
  });
});

it("clueDepth 는 가장 긴 단서의 숫자 개수", () => {
  expect(clueDepth([[0], [1, 2, 3], [4]])).toBe(3);
});
