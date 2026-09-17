import { describe, expect, it } from "vitest";
import { cluesOf, lineClue, lineIndices, lineSatisfied } from "./clues";
import { CROSSED, EMPTY, FILLED, type CellState } from "./types";

const bools = (text: string) => [...text].map((ch) => ch === "#");
const states = (text: string) => [...text].map((ch): CellState => (ch === "#" ? FILLED : ch === "x" ? CROSSED : EMPTY));

describe("lineClue", () => {
  it.each([
    ["##..###.#.", [2, 3, 1]],
    ["..........", [0]],
    ["##########", [10]],
    ["#........#", [1, 1]],
  ])("%s → %j", (line, clue) => {
    expect(lineClue(bools(line))).toEqual(clue);
  });
});

it("cluesOf 는 행을 왼쪽→오른쪽, 열을 위→아래로 센다", () => {
  // 3×3: #.# / ### / ...
  expect(cluesOf(bools("#.####..."), 3)).toEqual({ rows: [[1, 1], [3], [0]], cols: [[2], [1], [2]] });
});

it("lineIndices 는 행 다음에 열 순서", () => {
  expect(lineIndices(2)).toEqual([[0, 1], [2, 3], [0, 2], [1, 3]]);
});

describe("lineSatisfied", () => {
  it("칠함 묶음이 단서와 같으면 참이고 ✕와 빈칸은 구분하지 않는다", () => {
    expect(lineSatisfied(states("##x.###x#."), [2, 3, 1])).toBe(true);
  });

  it.each([
    ["묶음 수가 다름", "##..###...", [2, 3, 1]],
    ["길이가 다름", "###.###.#.", [2, 3, 1]],
    ["칠한 칸이 없는데 단서가 있음", "xxxx......", [2, 3, 1]],
  ])("%s → 거짓", (_, line, clue) => {
    expect(lineSatisfied(states(line), clue)).toBe(false);
  });

  it("단서가 0인 줄은 칠한 칸이 없으면 참", () => {
    expect(lineSatisfied(states("x.x......."), [0])).toBe(true);
    expect(lineSatisfied(states("#........."), [0])).toBe(false);
  });
});
