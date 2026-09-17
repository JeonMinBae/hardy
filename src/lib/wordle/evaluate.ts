export type Mark = "correct" | "present" | "absent";

const RANK: Record<Mark, number> = { absent: 0, present: 1, correct: 2 };

/** 칸별 판정. 초록을 먼저 정한 뒤, 초록이 아닌 정답 자리에 남은 개수만큼만 노랑을 준다 */
export function evaluateGuess(guess: readonly string[], answer: readonly string[]): Mark[] {
  const marks: Mark[] = guess.map((jamo, i) => (jamo === answer[i] ? "correct" : "absent"));
  const left = new Map<string, number>();
  answer.forEach((jamo, i) => {
    if (marks[i] !== "correct") left.set(jamo, (left.get(jamo) ?? 0) + 1);
  });
  guess.forEach((jamo, i) => {
    const count = left.get(jamo) ?? 0;
    if (marks[i] === "correct" || count === 0) return;
    marks[i] = "present";
    left.set(jamo, count - 1);
  });
  return marks;
}

/** 화면 키보드 색. 제출한 줄에서 그 자모가 받은 가장 좋은 판정 */
export function keyMarks(guesses: readonly (readonly string[])[], answer: readonly string[]): Map<string, Mark> {
  const result = new Map<string, Mark>();
  for (const guess of guesses) {
    evaluateGuess(guess, answer).forEach((mark, i) => {
      const previous = result.get(guess[i]);
      if (!previous || RANK[mark] > RANK[previous]) result.set(guess[i], mark);
    });
  }
  return result;
}
