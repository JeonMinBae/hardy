import { describe, expect, it } from "vitest";
import { encodeSnapshot } from "./codec";
import { emptySnapshot } from "./game";
import { findPuzzle } from "./puzzles";
import { CROSSED, FILLED } from "./types";
import { buildGameSearch, buildListSearch, parseNonogramSearch } from "./url";

const parse = (query: string) => parseNonogramSearch(new URLSearchParams(query));
const PUZZLE = findPuzzle("15-1")!;

describe("parseNonogramSearch", () => {
  it.each([
    ["", 10],
    ["size=15", 15],
    ["size=20", 20],
    ["size=12", 10],
    ["size=15.0", 10],
    ["size=", 10],
  ])("%j → 목록 %i 탭", (query, size) => {
    expect(parse(query)).toEqual({ kind: "list", size });
  });

  it("p 만 있으면 새 게임이고 size 는 무시한다", () => {
    expect(parse("p=15-1&size=20")).toEqual({ kind: "new", puzzle: PUZZLE });
  });

  it("p·s 가 맞으면 상태를 복원한다", () => {
    const snapshot = emptySnapshot(15);
    snapshot.cells[0] = FILLED;
    snapshot.cells[224] = CROSSED;
    snapshot.elapsed = 61;
    snapshot.hints = 2;
    expect(parse(buildGameSearch(PUZZLE, snapshot))).toEqual({ kind: "restore", puzzle: PUZZLE, snapshot });
  });

  it.each([
    ["없는 퍼즐", "p=15-9999"],
    ["ID 형식이 아님", "p=cat"],
    ["s 디코딩 실패", "p=15-1&s=%%%"],
    ["다른 크기의 상태", `p=15-1&s=${encodeSnapshot(emptySnapshot(10))}`],
    ["s 가 비어 있음", "p=15-1&s="],
  ])("%s → 잘못된 링크", (_, query) => {
    expect(parse(query)).toEqual({ kind: "invalid" });
  });
});

it("buildListSearch 는 size 하나만 쓴다", () => {
  expect(buildListSearch(20)).toBe("size=20");
});
