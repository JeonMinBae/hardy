import { BitReader, BitWriter, fromBase64Url, toBase64Url } from "@/lib/common/bits";
import { CROSSED, type CellState, type Snapshot } from "./types";

const FORMAT_VERSION = 1;
const CELL_BITS = 2;
const ELAPSED_BITS = 20;
const HINT_BITS = 12;
export const MAX_ELAPSED = 2 ** ELAPSED_BITS - 1;
export const MAX_HINTS = 2 ** HINT_BITS - 1;

/** 형식 버전(8) · 칸 상태(칸마다 2) · 경과 초(20) · 힌트 횟수(12) 비트 */
export function encodeSnapshot({ cells, elapsed, hints }: Snapshot): string {
  const w = new BitWriter();
  w.write(FORMAT_VERSION, 8);
  for (const state of cells) w.write(state, CELL_BITS);
  w.write(Math.min(elapsed, MAX_ELAPSED), ELAPSED_BITS);
  w.write(Math.min(hints, MAX_HINTS), HINT_BITS);
  return toBase64Url(w.toBytes());
}

/** 형식이 틀리거나 칸 수가 cellCount 와 다르면 null */
export function decodeSnapshot(text: string, cellCount: number): Snapshot | null {
  const bytes = fromBase64Url(text);
  if (!bytes) return null;
  const r = new BitReader(bytes);
  try {
    if (r.read(8) !== FORMAT_VERSION) return null;
    const cells: CellState[] = [];
    for (let i = 0; i < cellCount; i++) {
      const state = r.read(CELL_BITS);
      if (state > CROSSED) return null;
      cells.push(state as CellState);
    }
    const elapsed = r.read(ELAPSED_BITS);
    const hints = r.read(HINT_BITS);
    // 칸 수가 더 많은 판의 값이면 여기서 남은 비트가 있고, 더 적으면 위에서 RangeError 가 난다
    if (!r.isAtPaddedEnd()) return null;
    return { cells, elapsed, hints };
  } catch {
    return null;
  }
}
