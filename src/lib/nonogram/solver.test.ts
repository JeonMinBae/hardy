import { describe, expect, it } from "vitest";
import { cluesOf } from "./clues";
import { solveByLines, solveLine, type Known } from "./solver";

const known = (text: string) => [...text].map((ch): Known => (ch === "#" ? 1 : ch === "." ? 0 : -1));
const show = (cells: readonly Known[] | null) => cells?.map((v) => (v === 1 ? "#" : v === 0 ? "." : "?")).join("") ?? null;

describe("solveLine", () => {
  it.each([
    // 단서 합 + 간격이 줄 길이와 같으면 전부 확정
    [[3, 1], "?????", "###.#"],
    // 겹치는 가운데만 확정
    [[4], "??????", "??##??"],
    [[0], "?????", "....."],
    // 확정된 칸이 배치를 좁힌다
    [[2], "?#???", "?#?.."],
    [[1, 1], "#????", "#.???"],
    // 더 확정할 것이 없음
    [[1], "???", "???"],
  ])("단서 %j, %s → %s", (clue, line, expected) => {
    expect(show(solveLine(clue, known(line)))).toBe(expected);
  });

  it.each([
    [[3], "#.#??"],
    [[0], "??#??"],
    [[2, 2], "????"],
  ])("단서 %j 와 %s 는 모순 → null", (clue, line) => {
    expect(solveLine(clue, known(line))).toBeNull();
  });
});

describe("solveByLines", () => {
  const bools = (rows: string[]) => rows.join("").split("").map((ch) => ch === "#");

  it("줄 단위 논리로 풀리는 판은 정답까지 확정한다", () => {
    const rows = [".###.", "##.##", "#####", "#...#", "#...#"];
    const size = rows.length;
    expect(show(solveByLines(cluesOf(bools(rows), size), size))).toBe(rows.join(""));
  });

  it("해가 둘 이상인 판은 미확정 칸이 남는다", () => {
    // #. / .# 와 .# / #. 는 단서가 같다
    const solved = solveByLines(cluesOf(bools(["#.", ".#"]), 2), 2);
    expect(show(solved)).toBe("????");
  });
});
