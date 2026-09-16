import type { Mode } from "./types";

const NINE = Array.from({ length: 9 }, (_, i) => i);
const ROWS = NINE.map((r) => NINE.map((c) => r * 9 + c));
const COLS = NINE.map((c) => NINE.map((r) => r * 9 + c));
const BOXES = NINE.map((b) =>
  NINE.map((k) => (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3)),
);
// 주대각선 (r, r) = r * 10, 반대각선 (r, 8 - r) = r * 8 + 8
const DIAGONALS = [NINE.map((r) => r * 10), NINE.map((r) => r * 8 + 8)];

const UNITS: Record<Mode, number[][]> = {
  normal: [...ROWS, ...COLS, ...BOXES],
  x: [...ROWS, ...COLS, ...BOXES, ...DIAGONALS],
};

function buildPeers(units: number[][]): number[][] {
  return Array.from({ length: 81 }, (_, cell) => {
    const peers = new Set<number>();
    for (const unit of units) if (unit.includes(cell)) unit.forEach((p) => peers.add(p));
    peers.delete(cell);
    return [...peers];
  });
}

const PEERS: Record<Mode, number[][]> = {
  normal: buildPeers(UNITS.normal),
  x: buildPeers(UNITS.x),
};

export const DIAGONAL_CELLS: ReadonlySet<number> = new Set(DIAGONALS.flat());
export const getUnits = (mode: Mode): number[][] => UNITS[mode];
export const getPeers = (mode: Mode): number[][] => PEERS[mode];
