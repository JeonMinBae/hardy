import { summarizeDaily } from "@/lib/common/streak";
import type { Mark } from "./evaluate";
import { MAX_GUESSES } from "./game";

/** 성공한 시도 수(1~8) 또는 실패. 자모 6개·6번 시도 시절 기록은 1~6 으로 남아 있다 */
export type Result = number | "lost";
/** 문제 번호 → 결과 */
export type Results = Record<number, Result>;

export interface Stats {
  played: number;
  /** 반올림한 정수 % */
  winRate: number;
  currentStreak: number;
  maxStreak: number;
  /** 인덱스 i = 시도 수 i + 1 로 성공한 문제 수 */
  distribution: number[];
}

export const recordResult = (results: Results, puzzle: number, result: Result): Results => ({ ...results, [puzzle]: result });

export function computeStats(results: Results, today: number): Stats {
  const distribution = Array<number>(MAX_GUESSES).fill(0);
  for (const result of Object.values(results)) if (typeof result === "number") distribution[result - 1]++;
  return { ...summarizeDaily(results, today, (result) => typeof result === "number"), distribution };
}

const EMOJI: Record<Mark, string> = { correct: "🟩", present: "🟨", absent: "⬜" };

export function shareText(rows: readonly (readonly Mark[])[], won: boolean, url: string): string {
  const score = won ? String(rows.length) : "X";
  const grid = rows.map((row) => row.map((mark) => EMOJI[mark]).join(""));
  return [`hardy 워들 ${score}/${MAX_GUESSES}`, "", ...grid, "", url].join("\n");
}
