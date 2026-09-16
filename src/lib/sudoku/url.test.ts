import { describe, expect, it } from "vitest";
import { generatePuzzle } from "./generator";
import { countSolutions } from "./solver";
import type { Snapshot } from "./types";
import { buildGameSearch, parseGameSearch } from "./url";
import { SAMPLE_PUZZLE, SAMPLE_SOLUTION, mulberry32, parseGrid } from "./testing";

const parse = (query: string) => parseGameSearch(new URLSearchParams(query));
const sample = (over: Partial<Snapshot> = {}): Snapshot => ({
  mode: "normal",
  difficulty: "medium",
  givens: parseGrid(SAMPLE_PUZZLE),
  values: Array(81).fill(0),
  hints: Array(81).fill(false),
  notes: Array(81).fill(0),
  elapsed: 0,
  ...over,
});

describe("parseGameSearch", () => {
  it("파라미터가 없으면 선택 화면", () => {
    expect(parse("")).toEqual({ kind: "select" });
  });

  it("m·d 만 있으면 새 게임", () => {
    expect(parse("m=x&d=hard")).toEqual({ kind: "new", mode: "x", difficulty: "hard" });
  });

  it.each(["m=x", "d=hard", "m=y&d=hard", "m=x&d=expert", "s=abc", "d=hard&s=abc", "m=x&d=hard&s=%%%"])(
    "%s 는 잘못된 링크",
    (query) => {
      expect(parse(query)).toEqual({ kind: "invalid" });
    },
  );

  it("상태를 복원하고 해를 함께 돌려준다. 사용자 입력의 중복은 정상", () => {
    const snapshot = sample({ elapsed: 95 });
    snapshot.values[2] = 4;
    snapshot.values[3] = 4; // 같은 0행 중복
    snapshot.values[5] = 8;
    snapshot.hints[5] = true;
    snapshot.notes[3] = 0b1;
    expect(parse(buildGameSearch(snapshot))).toEqual({
      kind: "restore",
      snapshot,
      solution: parseGrid(SAMPLE_SOLUTION),
    });
  });

  it("주어진 칸 수가 난이도 범위 밖이면 잘못된 링크", () => {
    expect(parse(buildGameSearch(sample({ difficulty: "easy" })))).toEqual({ kind: "invalid" });
  });

  it("모드 규칙에서 해가 없으면 잘못된 링크", () => {
    expect(parse(buildGameSearch(sample({ mode: "x" })))).toEqual({ kind: "invalid" });
  });

  it("주어진 칸끼리 충돌하면 잘못된 링크", () => {
    const snapshot = sample();
    snapshot.givens[2] = 5; // 0행에 5 가 두 번, 주어진 칸 31개(중급)
    expect(parse(buildGameSearch(snapshot))).toEqual({ kind: "invalid" });
  });

  it("해가 여러 개면 잘못된 링크", () => {
    // 주어진 칸 두 개를 지워 28칸(고급)으로 만들고, 해가 여러 개가 되는 조합을 찾는다
    const givens = parseGrid(SAMPLE_PUZZLE);
    const filled = givens.flatMap((v, i) => (v ? [i] : []));
    const pairs = filled.flatMap((a, k) => filled.slice(k + 1).map((b) => [a, b]));
    const ambiguous = pairs
      .map(([a, b]) => givens.map((v, i) => (i === a || i === b ? 0 : v)))
      .find((grid) => countSolutions(grid, "normal") > 1);
    expect(ambiguous).toBeDefined();
    expect(parse(buildGameSearch(sample({ difficulty: "hard", givens: ambiguous! })))).toEqual({ kind: "invalid" });
  });

  it("힌트 값이 정답과 다르면 잘못된 링크", () => {
    const snapshot = sample();
    snapshot.values[5] = 1;
    snapshot.hints[5] = true;
    expect(parse(buildGameSearch(snapshot))).toEqual({ kind: "invalid" });
  });

  it("주어진 칸이나 힌트 칸에 메모가 있으면 잘못된 링크", () => {
    const onGiven = sample();
    onGiven.notes[0] = 0b1;
    const onHint = sample();
    onHint.values[5] = 8;
    onHint.hints[5] = true;
    onHint.notes[5] = 0b1;
    expect(parse(buildGameSearch(onGiven))).toEqual({ kind: "invalid" });
    expect(parse(buildGameSearch(onHint))).toEqual({ kind: "invalid" });
  });

  it("X 모드 퍼즐도 복원한다", () => {
    const { givens, solution } = generatePuzzle("x", "hard", mulberry32(3));
    const snapshot = sample({ mode: "x", difficulty: "hard", givens });
    expect(parse(buildGameSearch(snapshot))).toEqual({ kind: "restore", snapshot, solution });
  }, 30_000);
});
