import type { Grid, Snapshot } from "./types";

const FORMAT_VERSION = 1;
const ELAPSED_BITS = 20;
export const MAX_ELAPSED = 2 ** ELAPSED_BITS - 1;

const KIND_EMPTY = 0;
const KIND_GIVEN = 1;
const KIND_VALUE = 2;
const KIND_HINT = 3;

export type BoardState = Omit<Snapshot, "mode" | "difficulty">;

export class BitWriter {
  private bytes: number[] = [];
  private length = 0;

  write(value: number, bits: number) {
    for (let b = bits - 1; b >= 0; b--) {
      if (this.length % 8 === 0) this.bytes.push(0);
      if ((value >> b) & 1) this.bytes[this.bytes.length - 1] |= 0x80 >> (this.length % 8);
      this.length++;
    }
  }

  toBytes(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

class BitReader {
  private position = 0;
  constructor(private readonly bytes: Uint8Array) {}

  private bitAt(p: number): number {
    return (this.bytes[p >> 3] >> (7 - (p % 8))) & 1;
  }

  read(bits: number): number {
    if (this.position + bits > this.bytes.length * 8) throw new RangeError("비트 부족");
    let value = 0;
    for (let i = 0; i < bits; i++) value = (value << 1) | this.bitAt(this.position++);
    return value;
  }

  /** 읽은 뒤 남은 것이 마지막 바이트의 0 패딩뿐인지 */
  isAtPaddedEnd(): boolean {
    if (this.bytes.length !== Math.ceil(this.position / 8)) return false;
    for (let p = this.position; p < this.bytes.length * 8; p++) if (this.bitAt(p)) return false;
    return true;
  }
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(text: string): Uint8Array | null {
  // 패딩 없는 base64url 만 받는다. 길이 % 4 === 1 은 어떤 바이트열에서도 나오지 않는다
  if (!/^[A-Za-z0-9_-]+$/.test(text) || text.length % 4 === 1) return null;
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "=");
  try {
    return Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  } catch {
    return null;
  }
}

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
