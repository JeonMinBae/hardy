import { lineIndices, type Clues } from "./clues";

/** 1 칠함, 0 빈칸, -1 미확정 */
export type Known = 1 | 0 | -1;

/**
 * 단서와 이미 확정된 칸에 맞는 모든 배치에서 공통인 칸을 확정한다. 맞는 배치가 없으면 null.
 * feasible[i][b]: i번 칸부터 b번 묶음 이후를 배치할 수 있는지(뒤에서부터 채우는 DP)
 */
export function solveLine(clue: readonly number[], line: readonly Known[]): Known[] | null {
  const blocks = clue[0] === 0 ? [] : clue;
  const n = line.length;
  const k = blocks.length;
  const feasible = Array.from({ length: n + 2 }, () => Array<boolean>(k + 1).fill(false));
  // 묶음 b 를 i번 칸부터 놓을 수 있고, 바로 뒤 칸이 빈칸일 수 있는지
  const canPlace = (i: number, b: number) => {
    const end = i + blocks[b];
    if (end > n) return false;
    for (let j = i; j < end; j++) if (line[j] === 0) return false;
    return end === n || line[end] !== 1;
  };
  const next = (i: number, b: number) => Math.min(i + blocks[b] + 1, n + 1);

  feasible[n + 1][k] = true;
  feasible[n][k] = true;
  for (let i = n - 1; i >= 0; i--) {
    for (let b = k; b >= 0; b--) {
      const asEmpty = line[i] !== 1 && feasible[i + 1][b];
      const asBlock = b < k && canPlace(i, b) && feasible[next(i, b)][b + 1];
      feasible[i][b] = asEmpty || asBlock;
    }
  }
  if (!feasible[0][0]) return null;

  // 앞에서부터 도달 가능하고 끝까지 이어지는 선택만 따라가며 칸마다 가능한 값을 모은다
  const canFill = Array<boolean>(n).fill(false);
  const canEmpty = Array<boolean>(n).fill(false);
  const reached = Array.from({ length: n + 2 }, () => Array<boolean>(k + 1).fill(false));
  reached[0][0] = true;
  for (let i = 0; i < n; i++) {
    for (let b = 0; b <= k; b++) {
      if (!reached[i][b] || !feasible[i][b]) continue;
      if (line[i] !== 1 && feasible[i + 1][b]) {
        canEmpty[i] = true;
        reached[i + 1][b] = true;
      }
      if (b < k && canPlace(i, b) && feasible[next(i, b)][b + 1]) {
        for (let j = i; j < i + blocks[b]; j++) canFill[j] = true;
        if (i + blocks[b] < n) canEmpty[i + blocks[b]] = true;
        reached[next(i, b)][b + 1] = true;
      }
    }
  }
  return line.map((_, i) => (canFill[i] && !canEmpty[i] ? 1 : canEmpty[i] && !canFill[i] ? 0 : -1));
}

/** 줄 단위 논리만으로 확정할 수 있는 칸을 모두 확정한다. 모순이면 null */
export function solveByLines(clues: Clues, size: number): Known[] | null {
  const cells = Array<Known>(size * size).fill(-1);
  const lines = lineIndices(size);
  const lineClues = [...clues.rows, ...clues.cols];
  let changed = true;
  while (changed) {
    changed = false;
    for (let l = 0; l < lines.length; l++) {
      const solved = solveLine(lineClues[l], lines[l].map((i) => cells[i]));
      if (!solved) return null;
      solved.forEach((value, j) => {
        const index = lines[l][j];
        if (value !== -1 && cells[index] === -1) {
          cells[index] = value;
          changed = true;
        }
      });
    }
  }
  return cells;
}
