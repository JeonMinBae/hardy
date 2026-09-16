import { shuffle } from "./random";
import { countSolutions, randomSolvedGrid } from "./solver";
import { GIVEN_RANGE, type Difficulty, type Grid, type Mode } from "./types";

const MAX_ATTEMPTS = 20;

export interface Puzzle {
  givens: Grid;
  solution: Grid;
}

export function generatePuzzle(mode: Mode, difficulty: Difficulty, random: () => number = Math.random): Puzzle {
  const { min, max } = GIVEN_RANGE[difficulty];
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const solution = randomSolvedGrid(mode, random);
    const target = min + Math.floor(random() * (max - min + 1));
    const givens = solution.slice();
    let count = 81;
    // 지워서 해가 여러 개가 된 칸은 이후 더 지워도 다시 유일해지지 않으므로 한 바퀴만 돈다
    for (const cell of shuffle(Array.from({ length: 81 }, (_, i) => i), random)) {
      if (count === target) break;
      givens[cell] = 0;
      if (countSolutions(givens, mode, 2) === 1) count--;
      else givens[cell] = solution[cell];
    }
    // 목표까지 못 지웠어도 범위 안이면 쓴다(고급에서 생긴다)
    if (count <= max) return { givens, solution };
  }
  throw new Error(`퍼즐 생성 실패: ${mode}/${difficulty}`);
}
