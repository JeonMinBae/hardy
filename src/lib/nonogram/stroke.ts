import { CROSSED, EMPTY, FILLED, type CellState, type Mode } from "./types";

export type Axis = "row" | "col";

export const markOf = (mode: Mode): CellState => (mode === "fill" ? FILLED : CROSSED);

/** 시작 칸이 이미 현재 모드의 표시면 지우기(빈칸), 아니면 그 표시. 지나가는 칸은 모두 이 상태가 된다 */
export const strokeTarget = (mode: Mode, startState: CellState): CellState => (startState === markOf(mode) ? EMPTY : markOf(mode));

/** 포인터가 시작 칸을 처음 벗어날 때 방향을 정한다. 아직 시작 칸이면 null. 가로 차이가 세로 차이 이상이면 행 */
export function lockAxis(size: number, start: number, row: number, col: number): Axis | null {
  const dr = Math.abs(row - Math.floor(start / size));
  const dc = Math.abs(col - (start % size));
  if (dr === 0 && dc === 0) return null;
  return dc >= dr ? "row" : "col";
}

/** 시작 칸부터 포인터 위치를 고정 방향에 투영한 칸까지. 판 밖 좌표는 가장자리로 제한한다 */
export function strokeCells(size: number, start: number, axis: Axis, row: number, col: number): number[] {
  const startRow = Math.floor(start / size);
  const startCol = start % size;
  const from = axis === "row" ? startCol : startRow;
  const to = Math.min(size - 1, Math.max(0, axis === "row" ? col : row));
  const cells: number[] = [];
  for (let i = Math.min(from, to); i <= Math.max(from, to); i++) cells.push(axis === "row" ? startRow * size + i : i * size + startCol);
  return cells;
}
