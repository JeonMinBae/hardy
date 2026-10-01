import { BitReader, BitWriter, fromBase64Url, toBase64Url } from "@/lib/common/bits";
import type { Axis, CubeSize, Move } from "./cube";

const FORMAT_VERSION = 1;
const MOVE_BITS = 5;
const SCRAMBLE_BITS = 6;
const HISTORY_BITS = 12;
const COUNT_BITS = 16;
const ELAPSED_BITS = 20;
export const MAX_ELAPSED = 2 ** ELAPSED_BITS - 1;
/** URL 이 수 KB 를 넘지 않게 막는 상한. 넘으면 URL 갱신을 멈추고 게임은 계속한다 */
export const MAX_HISTORY = 2 ** HISTORY_BITS - 1;
const MAX_COUNT = 2 ** COUNT_BITS - 1;

/** 크기마다 축 3 × 층 N × 방향 2 개. 3×3 이 18 개라 5비트에 들어간다 */
export const moveToCode = ({ axis, layer, turns }: Move, size: CubeSize) => (axis * size + layer) * 2 + (turns === 1 ? 0 : 1);

export function codeToMove(code: number, size: CubeSize): Move | null {
  if (!Number.isInteger(code) || code < 0 || code >= 3 * size * 2) return null;
  const turns = code % 2 === 0 ? 1 : -1;
  const rest = Math.floor(code / 2);
  return { axis: Math.floor(rest / size) as Axis, layer: rest % size, turns };
}

export interface PracticeSnapshot {
  size: CubeSize;
  scramble: readonly Move[];
  history: readonly Move[];
  moveCount: number;
  elapsed: number;
}

export function encodePractice(p: PracticeSnapshot): string | null {
  if (p.history.length > MAX_HISTORY || p.scramble.length >= 2 ** SCRAMBLE_BITS) return null;
  const w = new BitWriter();
  w.write(FORMAT_VERSION, 8);
  w.write(p.size === 3 ? 1 : 0, 1);
  w.write(p.scramble.length, SCRAMBLE_BITS);
  w.write(p.history.length, HISTORY_BITS);
  w.write(Math.min(p.moveCount, MAX_COUNT), COUNT_BITS);
  w.write(Math.min(p.elapsed, MAX_ELAPSED), ELAPSED_BITS);
  for (const move of [...p.scramble, ...p.history]) w.write(moveToCode(move, p.size), MOVE_BITS);
  return toBase64Url(w.toBytes());
}

/** 형식이 틀리면 null */
export function decodePractice(text: string): PracticeSnapshot | null {
  const bytes = fromBase64Url(text);
  if (!bytes) return null;
  const r = new BitReader(bytes);
  try {
    if (r.read(8) !== FORMAT_VERSION) return null;
    const size: CubeSize = r.read(1) === 1 ? 3 : 2;
    const scrambleLength = r.read(SCRAMBLE_BITS);
    const historyLength = r.read(HISTORY_BITS);
    const moveCount = r.read(COUNT_BITS);
    const elapsed = r.read(ELAPSED_BITS);
    if (scrambleLength === 0 || moveCount < historyLength) return null;
    const moves: Move[] = [];
    for (let i = 0; i < scrambleLength + historyLength; i++) {
      const move = codeToMove(r.read(MOVE_BITS), size);
      if (!move) return null;
      moves.push(move);
    }
    if (!r.isAtPaddedEnd()) return null;
    return { size, scramble: moves.slice(0, scrambleLength), history: moves.slice(scrambleLength), moveCount, elapsed };
  } catch {
    return null;
  }
}
