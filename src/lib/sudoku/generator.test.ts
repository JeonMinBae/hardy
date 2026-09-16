import { describe, expect, it } from "vitest";
import { generatePuzzle } from "./generator";
import { countSolutions, solve } from "./solver";
import { DIFFICULTIES, GIVEN_RANGE, MODES } from "./types";
import { getUnits } from "./units";
import { mulberry32 } from "./testing";

describe.each(MODES)("generatePuzzle %s", (mode) => {
  it.each(DIFFICULTIES)(
    "%s: 주어진 칸 수가 범위 안이고 해가 하나다",
    (difficulty) => {
      const { givens, solution } = generatePuzzle(mode, difficulty, mulberry32(42));
      const count = givens.filter((v) => v !== 0).length;
      expect(count).toBeGreaterThanOrEqual(GIVEN_RANGE[difficulty].min);
      expect(count).toBeLessThanOrEqual(GIVEN_RANGE[difficulty].max);
      expect(countSolutions(givens, mode)).toBe(1);
      expect(solve(givens, mode)).toEqual(solution);
      givens.forEach((v, i) => {
        if (v !== 0) expect(v).toBe(solution[i]);
      });
    },
    30_000,
  );
});

it("X 모드 해는 두 대각선에 1~9 가 한 번씩", () => {
  const { solution } = generatePuzzle("x", "hard", mulberry32(7));
  for (const diagonal of getUnits("x").slice(27)) {
    expect(new Set(diagonal.map((i) => solution[i])).size).toBe(9);
  }
}, 30_000);

it("같은 시드는 같은 퍼즐", () => {
  expect(generatePuzzle("normal", "easy", mulberry32(5))).toEqual(generatePuzzle("normal", "easy", mulberry32(5)));
});
