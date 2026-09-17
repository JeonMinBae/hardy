import { BitReader, BitWriter, fromBase64Url, toBase64Url } from "@/lib/common/bits";
import type { Grid, Snapshot } from "./types";

const FORMAT_VERSION = 1;
const ELAPSED_BITS = 20;
export const MAX_ELAPSED = 2 ** ELAPSED_BITS - 1;

const KIND_EMPTY = 0;
const KIND_GIVEN = 1;
const KIND_VALUE = 2;
const KIND_HINT = 3;

export type BoardState = Omit<Snapshot, "mode" | "difficulty">;

export function encodeBoard(board: BoardState): string {
  const w = new BitWriter();
  w.write(FORMAT_VERSION, 8);
  for (let i = 0; i < 81; i++) {
    const value = board.givens[i] || board.values[i];
    const kind = board.givens[i] ? KIND_GIVEN : value === 0 ? KIND_EMPTY : board.hints[i] ? KIND_HINT : KIND_VALUE;
    w.write(kind, 2);
    if (kind !== KIND_EMPTY) w.write(value, 4);
  }
  for (let i = 0; i < 81; i++) {
    w.write(board.notes[i] === 0 ? 0 : 1, 1);
    if (board.notes[i] !== 0) w.write(board.notes[i], 9);
  }
  w.write(Math.min(board.elapsed, MAX_ELAPSED), ELAPSED_BITS);
  return toBase64Url(w.toBytes());
}

/** 형식이 틀리면 null. 퍼즐 규칙 검증은 url.ts 가 한다 */
export function decodeBoard(text: string): BoardState | null {
  const bytes = fromBase64Url(text);
  if (!bytes) return null;
  const r = new BitReader(bytes);
  try {
    if (r.read(8) !== FORMAT_VERSION) return null;
    const givens: Grid = [];
    const values: Grid = [];
    const hints: boolean[] = [];
    const notes: number[] = [];
    for (let i = 0; i < 81; i++) {
      const kind = r.read(2);
      const value = kind === KIND_EMPTY ? 0 : r.read(4);
      if (kind !== KIND_EMPTY && (value < 1 || value > 9)) return null;
      givens.push(kind === KIND_GIVEN ? value : 0);
      values.push(kind === KIND_VALUE || kind === KIND_HINT ? value : 0);
      hints.push(kind === KIND_HINT);
    }
    for (let i = 0; i < 81; i++) {
      const hasNotes = r.read(1) === 1;
      const mask = hasNotes ? r.read(9) : 0;
      if (hasNotes && mask === 0) return null;
      notes.push(mask);
    }
    const elapsed = r.read(ELAPSED_BITS);
    if (!r.isAtPaddedEnd()) return null;
    return { givens, values, hints, notes, elapsed };
  } catch {
    return null; // 비트가 모자라면 BitReader 가 던진다
  }
}
