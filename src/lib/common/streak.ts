export interface DailySummary {
  played: number;
  /** 반올림한 정수 % */
  winRate: number;
  currentStreak: number;
  maxStreak: number;
}

/** results: 문제 번호 → 결과. 기록된 결과 중 isWin 이 false 인 것은 실패로 본다 */
export function summarizeDaily<R>(results: Record<number, R>, today: number, isWin: (result: R) => boolean): DailySummary {
  const puzzles = Object.keys(results).map(Number);
  const won = (puzzle: number) => puzzle in results && isWin(results[puzzle]);
  const wins = puzzles.filter(won).sort((a, b) => a - b);

  let maxStreak = 0;
  let run = 0;
  wins.forEach((puzzle, i) => {
    run = i > 0 && wins[i - 1] === puzzle - 1 ? run + 1 : 1;
    maxStreak = Math.max(maxStreak, run);
  });

  // 오늘 실패했으면 0이다. 오늘을 아직 안 풀었으면 어제까지 이어진 연속 기록은 살아 있다
  let currentStreak = 0;
  if (!(today in results) || won(today)) {
    for (let puzzle = won(today) ? today : today - 1; won(puzzle); puzzle--) currentStreak++;
  }

  const winRate = puzzles.length === 0 ? 0 : Math.round((wins.length / puzzles.length) * 100);
  return { played: puzzles.length, winRate, currentStreak, maxStreak };
}
