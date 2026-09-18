import type { Grid, Mode, Snapshot } from "./types";
import { getUnits } from "./units";

/** 주어진 칸·힌트·입력을 합친 판 */
export function boardValues(snapshot: Pick<Snapshot, "givens" | "values">): Grid {
  return snapshot.givens.map((given, i) => given || snapshot.values[i]);
}

const isFilledWithoutDuplicates = (board: Grid, unit: number[]) =>
  unit.every((i) => board[i] !== 0) && new Set(unit.map((i) => board[i])).size === 9;

/** 중복 없이 다 채워진 단위에 속한 칸(초록 표시). 정답 여부는 보지 않는다 */
export function completedUnitCells(board: Grid, mode: Mode): boolean[] {
  const result = Array<boolean>(81).fill(false);
  for (const unit of getUnits(mode)) {
    if (isFilledWithoutDuplicates(board, unit)) unit.forEach((i) => (result[i] = true));
  }
  return result;
}

/** 해가 하나뿐인 퍼즐이므로 모든 단위가 중복 없이 채워지면 곧 정답이다 */
export function isComplete(board: Grid, mode: Mode): boolean {
  return getUnits(mode).every((unit) => isFilledWithoutDuplicates(board, unit));
}

/** index 1~9 의 남은 개수(0 미만은 0). index 0 은 쓰지 않는다 */
export function remainingCounts(board: Grid): number[] {
  const counts = Array<number>(10).fill(9);
  for (const v of board) if (v !== 0) counts[v]--;
  return counts.map((n) => Math.max(0, n));
}

/** 같은 단위에 같은 값이 또 있는 칸. 중복된 칸 모두를 표시한다 */
export function conflictCells(board: Grid, mode: Mode): boolean[] {
  const result = Array<boolean>(81).fill(false);
  for (const unit of getUnits(mode)) {
    const byValue = new Map<number, number[]>();
    for (const i of unit) {
      if (board[i] === 0) continue;
      const cells = byValue.get(board[i]);
      if (cells) cells.push(i);
      else byValue.set(board[i], [i]);
    }
    for (const cells of byValue.values()) {
      if (cells.length > 1) cells.forEach((i) => (result[i] = true));
    }
  }
  return result;
}
