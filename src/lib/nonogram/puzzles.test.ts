import { describe, expect, it } from "vitest";
import { cluesOf } from "./clues";
import { findPuzzle, listPuzzles, PUZZLES } from "./puzzles";
import { solveByLines, type Known } from "./solver";
import { SIZES } from "./types";

const MIN_PUZZLES = 20;
const render = (cells: readonly Known[], size: number) =>
  Array.from({ length: size }, (_, r) => cells.slice(r * size, (r + 1) * size).map((v) => (v === 1 ? "#" : v === 0 ? "." : "?")).join(""));

describe.each(SIZES.map((size) => [`${size}×${size}`, size] as const))("%s 퍼즐", (_, size) => {
  const puzzles = listPuzzles(size);

  it(`${MIN_PUZZLES}개 이상`, () => {
    expect(puzzles.length).toBeGreaterThanOrEqual(MIN_PUZZLES);
  });

  it.each(puzzles.map((puzzle) => [puzzle.id, puzzle.title, puzzle] as const))("%s %s: 크기·문자·제목", (_, __, puzzle) => {
    const { rows } = PUZZLES[size][puzzle.number - 1];
    expect(rows).toHaveLength(size);
    for (const row of rows) expect(row).toMatch(new RegExp(`^[#.]{${size}}$`));
    expect(puzzle.title.trim()).not.toBe("");
  });

  // 실패하면 받은 값의 ? 가 줄 단위 논리로 확정되지 않은 칸이다. 그 근처 그림을 고친다
  it.each(puzzles.map((puzzle) => [puzzle.id, puzzle.title, puzzle] as const))("%s %s: 줄 단위 논리로 추측 없이 풀린다", (_, __, puzzle) => {
    const solved = solveByLines(cluesOf(puzzle.solution, size), size);
    expect(solved && render(solved, size)).toEqual(PUZZLES[size][puzzle.number - 1].rows);
  });
});

it("같은 그림이 없다", () => {
  const pictures = SIZES.flatMap((size) => PUZZLES[size].map((data) => data.rows.join("")));
  expect(new Set(pictures).size).toBe(pictures.length);
});

describe("findPuzzle", () => {
  it("크기-번호 ID 로 찾는다", () => {
    const puzzle = findPuzzle("15-1")!;
    expect(puzzle).toMatchObject({ id: "15-1", size: 15, number: 1, title: PUZZLES[15][0].title });
    expect(puzzle.solution).toHaveLength(225);
  });

  it.each(["", "15", "15-0", "15-01", "12-1", "10-9999", "10-1-1", "a-1", " 10-1"])("%j → null", (id) => {
    expect(findPuzzle(id)).toBeNull();
  });
});
