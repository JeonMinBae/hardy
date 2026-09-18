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

const isWin = (results: Results, puzzle: number) => typeof results[puzzle] === "number";

export const recordResult = (results: Results, puzzle: number, result: Result): Results => ({ ...results, [puzzle]: result });

export function computeStats(results: Results, today: number): Stats {
  const puzzles = Object.keys(results).map(Number);
  const wins = puzzles.filter((puzzle) => isWin(results, puzzle)).sort((a, b) => a - b);
  const distribution = Array<number>(MAX_GUESSES).fill(0);
  for (const puzzle of wins) distribution[(results[puzzle] as number) - 1]++;

  let maxStreak = 0;
  let run = 0;
  wins.forEach((puzzle, i) => {
    run = i > 0 && wins[i - 1] === puzzle - 1 ? run + 1 : 1;
    maxStreak = Math.max(maxStreak, run);
  });

  // 오늘 실패했으면 0이다. 오늘을 아직 안 풀었으면 어제까지 이어진 연속 기록은 살아 있다
  let currentStreak = 0;
  if (results[today] !== "lost") {
    for (let puzzle = isWin(results, today) ? today : today - 1; isWin(results, puzzle); puzzle--) currentStreak++;
  }

  const winRate = puzzles.length === 0 ? 0 : Math.round((wins.length / puzzles.length) * 100);
  return { played: puzzles.length, winRate, currentStreak, maxStreak, distribution };
}

const EMOJI: Record<Mark, string> = { correct: "🟩", present: "🟨", absent: "⬜" };

export function shareText(rows: readonly (readonly Mark[])[], won: boolean, url: string): string {
  const score = won ? String(rows.length) : "X";
  const grid = rows.map((row) => row.map((mark) => EMOJI[mark]).join(""));
  return [`hardy 워들 ${score}/${MAX_GUESSES}`, "", ...grid, "", url].join("\n");
}
