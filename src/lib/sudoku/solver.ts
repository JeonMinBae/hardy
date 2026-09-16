import { shuffle } from "./random";
import type { Grid, Mode } from "./types";
import { getPeers } from "./units";

const DIGIT_BITS = 0x3fe; // bit 1~9

function bitCount(mask: number): number {
  let n = 0;
  for (let m = mask; m; m &= m - 1) n++;
  return n;
}

/** 해를 찾을 때마다 onSolution 을 부르고, true 를 돌려받으면 탐색을 멈춘다 */
function search(grid: Grid, mode: Mode, onSolution: (cells: Grid) => boolean, random?: () => number) {
  const peers = getPeers(mode);
  const cells = grid.slice();
  // 주어진 칸끼리 이미 충돌하면 해가 없다
  for (let i = 0; i < 81; i++) {
    if (cells[i] !== 0 && peers[i].some((p) => cells[p] === cells[i])) return;
  }

  const step = (): boolean => {
    // 후보가 가장 적은 빈칸부터 채운다(MRV)
    let best = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (let i = 0; i < 81 && bestCount > 1; i++) {
      if (cells[i] !== 0) continue;
      let used = 0;
      for (const p of peers[i]) used |= 1 << cells[p];
      const mask = DIGIT_BITS & ~used;
      const count = bitCount(mask);
      if (count === 0) return false;
      if (count < bestCount) {
        best = i;
        bestMask = mask;
        bestCount = count;
      }
    }
    if (best === -1) return onSolution(cells);

    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => bestMask & (1 << d));
    if (random) shuffle(digits, random);
    for (const d of digits) {
      cells[best] = d;
      if (step()) return true;
    }
    cells[best] = 0;
    return false;
  };
  step();
}

/** 해 개수를 limit 까지만 센다 */
export function countSolutions(grid: Grid, mode: Mode, limit = 2): number {
  let count = 0;
  search(grid, mode, () => ++count >= limit);
  return count;
}

export function solve(grid: Grid, mode: Mode): Grid | null {
  const found: Grid[] = [];
  search(grid, mode, (cells) => found.push(cells.slice()) > 0);
  return found[0] ?? null;
}

export function randomSolvedGrid(mode: Mode, random: () => number): Grid {
  const found: Grid[] = [];
  search(Array<number>(81).fill(0), mode, (cells) => found.push(cells.slice()) > 0, random);
  return found[0]; // 빈 판은 두 모드 모두 해가 있다
}
