export const SIZES = [10, 15, 20] as const;
export type Size = (typeof SIZES)[number];

export const EMPTY = 0;
export const FILLED = 1;
export const CROSSED = 2;
export type CellState = typeof EMPTY | typeof FILLED | typeof CROSSED;

export type Mode = "fill" | "cross";

/** URL 에 저장하는 게임 상태. 칸 인덱스는 row * size + col */
export interface Snapshot {
  cells: CellState[];
  elapsed: number;
  hints: number;
}

/** 퍼즐 원본. rows 는 위→아래 행이고 "#" 칠함, "." 빈칸 */
export interface PuzzleData {
  title: string;
  rows: readonly string[];
}

/** "10"·"15"·"20" 과 정확히 같은 문자열만 크기로 읽는다("15.0"·" 15" 는 아니다) */
export const parseSize = (text: string | null | undefined): Size | undefined => SIZES.find((size) => String(size) === text);
