import { decodeBoard, encodeBoard, type BoardState } from "./codec";
import { countSolutions, solve } from "./solver";
import { DIFFICULTIES, GIVEN_RANGE, MODES, type Difficulty, type Grid, type Mode, type Snapshot } from "./types";

export type UrlParseResult =
  | { kind: "select" }
  | { kind: "new"; mode: Mode; difficulty: Difficulty }
  | { kind: "restore"; snapshot: Snapshot; solution: Grid }
  | { kind: "invalid" };

const INVALID: UrlParseResult = { kind: "invalid" };
const isMode = (v: string | null): v is Mode => MODES.includes(v as Mode);
const isDifficulty = (v: string | null): v is Difficulty => DIFFICULTIES.includes(v as Difficulty);

export function parseGameSearch(params: URLSearchParams): UrlParseResult {
  const m = params.get("m");
  const d = params.get("d");
  const s = params.get("s");
  // m·d·s 외의 파라미터는 보지 않는다
  if (m === null && d === null && s === null) return { kind: "select" };
  if (!isMode(m) || !isDifficulty(d)) return INVALID;
  if (s === null) return { kind: "new", mode: m, difficulty: d };

  const board = decodeBoard(s);
  if (!board) return INVALID;
  const solution = validateBoard(board, m, d);
  return solution ? { kind: "restore", snapshot: { mode: m, difficulty: d, ...board }, solution } : INVALID;
}

/** 유효하면 해를, 아니면 null 을 돌려준다. 사용자 입력의 중복·오답은 검사하지 않는다 */
function validateBoard(board: BoardState, mode: Mode, difficulty: Difficulty): Grid | null {
  const { min, max } = GIVEN_RANGE[difficulty];
  const givenCount = board.givens.filter((v) => v !== 0).length;
  if (givenCount < min || givenCount > max) return null;
  if (board.notes.some((n, i) => n !== 0 && (board.givens[i] !== 0 || board.hints[i]))) return null;
  // 주어진 칸끼리 충돌하면 countSolutions 가 0 을 돌려준다
  if (countSolutions(board.givens, mode, 2) !== 1) return null;
  const solution = solve(board.givens, mode)!;
  if (board.hints.some((hint, i) => hint && board.values[i] !== solution[i])) return null;
  return solution;
}

/** "?" 없이 돌려준다. useSearchParams().toString() 과 같은 직렬화다 */
export function buildGameSearch(snapshot: Snapshot): string {
  const { mode, difficulty, ...board } = snapshot;
  return new URLSearchParams({ m: mode, d: difficulty, s: encodeBoard(board) }).toString();
}
