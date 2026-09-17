import { PUZZLES_10 } from "./puzzles/size10";
import { PUZZLES_15 } from "./puzzles/size15";
import { PUZZLES_20 } from "./puzzles/size20";
import { parseSize, type PuzzleData, type Size } from "./types";

export const PUZZLES: Record<Size, readonly PuzzleData[]> = { 10: PUZZLES_10, 15: PUZZLES_15, 20: PUZZLES_20 };

export interface PuzzleInfo {
  /** "크기-번호"(예: 15-3). 제목을 담지 않아 URL 로 그림이 드러나지 않는다 */
  id: string;
  size: Size;
  /** 크기별 목록에서의 순서(1부터) */
  number: number;
  title: string;
  /** 칸 인덱스 row * size + col 의 칠함 여부 */
  solution: boolean[];
}

const toInfo = (size: Size, number: number, data: PuzzleData): PuzzleInfo => ({
  id: `${size}-${number}`,
  size,
  number,
  title: data.title,
  solution: [...data.rows.join("")].map((ch) => ch === "#"),
});

export const listPuzzles = (size: Size): PuzzleInfo[] => PUZZLES[size].map((data, i) => toInfo(size, i + 1, data));

/** 없는 퍼즐이면 null */
export function findPuzzle(id: string): PuzzleInfo | null {
  const match = /^(\d+)-([1-9]\d*)$/.exec(id);
  const size = parseSize(match?.[1]);
  if (!match || !size) return null;
  const number = Number(match[2]);
  const data = PUZZLES[size][number - 1];
  return data ? toInfo(size, number, data) : null;
}
