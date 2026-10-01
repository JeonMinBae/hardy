import { describe, expect, it } from "vitest";
import { applyMoves, isSolved, solvedCube } from "./cube";
import { dailyScramble, mulberry32, scramble, SCRAMBLE_LENGTH } from "./scramble";

describe("scramble", () => {
  it.each([2, 3] as const)("%i×%i: 길이·연속 면·미완성", (size) => {
    for (let seed = 1; seed <= 50; seed++) {
      const moves = scramble(size, mulberry32(seed));
      expect(moves).toHaveLength(SCRAMBLE_LENGTH[size]);
      moves.slice(1).forEach((move, i) => expect([move.axis, move.layer]).not.toEqual([moves[i].axis, moves[i].layer]));
      expect(isSolved(applyMoves(solvedCube(size), moves))).toBe(false);
    }
  });
});

describe("dailyScramble", () => {
  it("같은 번호·크기면 같고, 다르면 다르다", () => {
    expect(dailyScramble(7, 3)).toEqual(dailyScramble(7, 3));
    expect(dailyScramble(7, 3)).not.toEqual(dailyScramble(8, 3));
  });
});
