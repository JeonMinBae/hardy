import { applyMoves, isSolved, solvedCube, type CubeSize, type Face, type Move } from "./cube";
import { faceMove, NOTATION_FACES } from "./notation";

export const SCRAMBLE_LENGTH: Record<CubeSize, number> = { 2: 11, 3: 25 };

/** 32비트 시드 의사난수. 같은 시드면 어느 기기에서나 같은 수열이다 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 바깥 면만 돌린다. 같은 면을 연달아 돌리지 않고, 결과가 완성 상태면 다시 섞는다 */
export function scramble(size: CubeSize, random: () => number): Move[] {
  while (true) {
    const moves: Move[] = [];
    let previous: Face | null = null;
    while (moves.length < SCRAMBLE_LENGTH[size]) {
      const face = NOTATION_FACES[Math.floor(random() * NOTATION_FACES.length)];
      if (face === previous) continue;
      previous = face;
      moves.push(faceMove(face, random() < 0.5, size));
    }
    if (!isSolved(applyMoves(solvedCube(size), moves))) return moves;
  }
}

export const dailyScramble = (puzzle: number, size: CubeSize) => scramble(size, mulberry32(puzzle * 10 + size));
