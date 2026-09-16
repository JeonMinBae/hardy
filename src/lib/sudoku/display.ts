import type { Difficulty, Grid, Mode } from "./types";
import { DIAGONAL_CELLS, getPeers } from "./units";

export type CellBackground = "selected" | "sameNumber" | "related" | "completed" | "diagonal" | "none";

export interface BackgroundContext {
  board: Grid;
  mode: Mode;
  selected: number | null;
  completed: boolean[];
}

// 겹치면 앞선 것이 보인다: 선택 강조 > 초록 > X 대각선 음영 > 기본
export function cellBackground(cell: number, { board, mode, selected, completed }: BackgroundContext): CellBackground {
  if (selected === cell) return "selected";
  if (selected !== null) {
    if (board[selected] !== 0 && board[cell] === board[selected]) return "sameNumber";
    if (getPeers(mode)[selected].includes(cell)) return "related";
  }
  if (completed[cell]) return "completed";
  if (mode === "x" && DIAGONAL_CELLS.has(cell)) return "diagonal";
  return "none";
}

export function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export const MODE_LABEL: Record<Mode, string> = { normal: "일반", x: "X" };
export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: "초급", medium: "중급", hard: "고급" };
