import { decodeSnapshot, encodeSnapshot } from "./codec";
import { findPuzzle, type PuzzleInfo } from "./puzzles";
import { parseSize, type Size, type Snapshot } from "./types";

export type NonogramRoute =
  | { kind: "list"; size: Size }
  | { kind: "new"; puzzle: PuzzleInfo }
  | { kind: "restore"; puzzle: PuzzleInfo; snapshot: Snapshot }
  | { kind: "invalid" };

export function parseNonogramSearch(params: URLSearchParams): NonogramRoute {
  const id = params.get("p");
  // p 가 있으면 size 는 보지 않는다
  if (id === null) return { kind: "list", size: parseSize(params.get("size")) ?? 10 };
  const puzzle = findPuzzle(id);
  if (!puzzle) return { kind: "invalid" };
  const s = params.get("s");
  if (s === null) return { kind: "new", puzzle };
  const snapshot = decodeSnapshot(s, puzzle.size * puzzle.size);
  return snapshot ? { kind: "restore", puzzle, snapshot } : { kind: "invalid" };
}

/** "?" 없이 돌려준다. useSearchParams().toString() 과 같은 직렬화다 */
export const buildGameSearch = (puzzle: PuzzleInfo, snapshot: Snapshot) => new URLSearchParams({ p: puzzle.id, s: encodeSnapshot(snapshot) }).toString();

export const buildListSearch = (size: Size) => new URLSearchParams({ size: String(size) }).toString();
