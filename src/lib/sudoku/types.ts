export type Mode = "normal" | "x";
export type Difficulty = "easy" | "medium" | "hard";

export const MODES: readonly Mode[] = ["normal", "x"];
export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

// 처음 주어지는 칸 수. 양 끝 포함
export const GIVEN_RANGE: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 38, max: 40 },
  medium: { min: 30, max: 34 },
  hard: { min: 24, max: 28 },
};

/** 길이 81, index = row * 9 + col, 0 = 빈칸 */
export type Grid = number[];

/** URL 에 저장되는 게임 상태 */
export interface Snapshot {
  mode: Mode;
  difficulty: Difficulty;
  givens: Grid;
  /** 사용자 입력 또는 힌트 값. 주어진 칸은 항상 0 */
  values: Grid;
  /** true 면 values[i] 는 힌트로 채운 값 */
  hints: boolean[];
  /** 칸별 메모 비트마스크. bit (d - 1) = 숫자 d */
  notes: number[];
  /** 경과 시간(초) */
  elapsed: number;
}
