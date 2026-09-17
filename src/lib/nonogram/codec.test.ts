import { describe, expect, it } from "vitest";
import { BitWriter, fromBase64Url, toBase64Url } from "@/lib/common/bits";
import { MAX_ELAPSED, MAX_HINTS, decodeSnapshot, encodeSnapshot } from "./codec";
import { CROSSED, EMPTY, FILLED, type CellState, type Snapshot } from "./types";

const sample = (size = 10): Snapshot => {
  const cells = Array<CellState>(size * size).fill(EMPTY);
  cells[0] = FILLED;
  cells[1] = CROSSED;
  cells[size * size - 1] = FILLED;
  return { cells, elapsed: 3725, hints: 7 };
};

describe("encodeSnapshot / decodeSnapshot", () => {
  it.each([10, 15, 20])("%i×%i 왕복", (size) => {
    const text = encodeSnapshot(sample(size));
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeSnapshot(text, size * size)).toEqual(sample(size));
  });

  it("경과 시간과 힌트 횟수는 최대값으로 자른다", () => {
    const decoded = decodeSnapshot(encodeSnapshot({ ...sample(), elapsed: MAX_ELAPSED + 5, hints: MAX_HINTS + 5 }), 100);
    expect(decoded).toMatchObject({ elapsed: MAX_ELAPSED, hints: MAX_HINTS });
  });

  it("다른 크기의 판으로 읽으면 null", () => {
    expect(decodeSnapshot(encodeSnapshot(sample(10)), 225)).toBeNull();
    expect(decodeSnapshot(encodeSnapshot(sample(15)), 100)).toBeNull();
    expect(decodeSnapshot(encodeSnapshot(sample(20)), 225)).toBeNull();
  });

  it("형식이 깨졌거나 알 수 없는 버전이면 null", () => {
    const bytes = fromBase64Url(encodeSnapshot(sample()))!;
    expect(decodeSnapshot("", 100)).toBeNull();
    expect(decodeSnapshot("ab+/", 100)).toBeNull();
    expect(decodeSnapshot(toBase64Url(Uint8Array.of(...bytes, 0)), 100)).toBeNull();
    const versioned = Uint8Array.from(bytes);
    versioned[0] = 2;
    expect(decodeSnapshot(toBase64Url(versioned), 100)).toBeNull();
  });

  it("칸 상태 값이 3이면 null", () => {
    const withFirstCell = (state: number) => {
      const w = new BitWriter();
      w.write(1, 8);
      w.write(state, 2);
      for (let i = 1; i < 100; i++) w.write(0, 2);
      w.write(0, 20);
      w.write(0, 12);
      return toBase64Url(w.toBytes());
    };
    expect(decodeSnapshot(withFirstCell(CROSSED), 100)).not.toBeNull();
    expect(decodeSnapshot(withFirstCell(3), 100)).toBeNull();
  });
});
