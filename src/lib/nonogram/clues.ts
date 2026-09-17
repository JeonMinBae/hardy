import { FILLED, type CellState } from "./types";

export interface Clues {
  rows: number[][];
  cols: number[][];
}

/** 행 size 개(위→아래) 다음에 열 size 개(왼쪽→오른쪽)의 칸 인덱스 */
export function lineIndices(size: number): number[][] {
  const range = Array.from({ length: size }, (_, i) => i);
  const rows = range.map((r) => range.map((c) => r * size + c));
  const cols = range.map((c) => range.map((r) => r * size + c));
  return [...rows, ...cols];
}

/** 연속으로 칠한 묶음의 길이. 칠한 칸이 없으면 [0] */
export function lineClue(filled: readonly boolean[]): number[] {
  const runs: number[] = [];
  let run = 0;
  for (const on of [...filled, false]) {
    if (on) run++;
    else if (run > 0) {
      runs.push(run);
      run = 0;
    }
  }
  return runs.length > 0 ? runs : [0];
}

export function cluesOf(solution: readonly boolean[], size: number): Clues {
  const lines = lineIndices(size).map((indices) => lineClue(indices.map((i) => solution[i])));
  return { rows: lines.slice(0, size), cols: lines.slice(size) };
}

/** 칠함 묶음이 단서와 정확히 같은지. 빈칸과 ✕는 구분하지 않는다 */
export function lineSatisfied(states: readonly CellState[], clue: readonly number[]): boolean {
  const actual = lineClue(states.map((state) => state === FILLED));
  return actual.length === clue.length && actual.every((run, i) => run === clue[i]);
}
