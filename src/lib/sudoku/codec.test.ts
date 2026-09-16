import { describe, expect, it } from "vitest";
import { BitWriter, MAX_ELAPSED, decodeBoard, encodeBoard, fromBase64Url, toBase64Url, type BoardState } from "./codec";
import { SAMPLE_PUZZLE, parseGrid } from "./testing";

// SAMPLE_PUZZLE 0행: 5 3 _ _ 7 _ _ _ _ (정답 534678912)
const sample = (): BoardState => {
  const values = Array<number>(81).fill(0);
  const hints = Array<boolean>(81).fill(false);
  const notes = Array<number>(81).fill(0);
  values[2] = 4;
  values[3] = 9; // 오답 입력도 그대로 저장
  values[5] = 8;
  hints[5] = true;
  notes[2] = 0b10; // 값과 메모 공존
  notes[6] = 0b100000001;
  return { givens: parseGrid(SAMPLE_PUZZLE), values, hints, notes, elapsed: 3725 };
};

describe("codec", () => {
  it("인코딩 후 디코딩하면 같은 상태", () => {
    expect(decodeBoard(encodeBoard(sample()))).toEqual(sample());
  });

  it("base64url 문자만 쓴다", () => {
    expect(encodeBoard(sample())).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("경과 시간은 최대값으로 자른다", () => {
    expect(decodeBoard(encodeBoard({ ...sample(), elapsed: MAX_ELAPSED + 10 }))?.elapsed).toBe(MAX_ELAPSED);
  });

  it("형식이 깨진 문자열은 null", () => {
    const bytes = fromBase64Url(encodeBoard(sample()))!;
    expect(decodeBoard("")).toBeNull();
    expect(decodeBoard("ab+/")).toBeNull();
    expect(decodeBoard(toBase64Url(bytes.slice(0, bytes.length - 2)))).toBeNull(); // 잘림
    expect(decodeBoard(toBase64Url(Uint8Array.of(...bytes, 0)))).toBeNull(); // 뒤에 덧붙음
  });

  it("알 수 없는 버전은 null", () => {
    // 나머지는 정상인 입력에서 버전 바이트만 바꾼다
    const bytes = fromBase64Url(encodeBoard(sample()))!;
    bytes[0] = 2;
    expect(decodeBoard(toBase64Url(bytes))).toBeNull();
  });

  it("채운 칸의 값이 1~9 가 아니면 null", () => {
    // 첫 칸만 주어진 칸인 온전한 길이의 입력. 값 검사가 없으면 디코딩에 성공한다
    const withFirstGiven = (value: number) => {
      const w = new BitWriter();
      w.write(1, 8);
      w.write(1, 2);
      w.write(value, 4);
      for (let i = 1; i < 81; i++) w.write(0, 2);
      for (let i = 0; i < 81; i++) w.write(0, 1);
      w.write(0, 20);
      return toBase64Url(w.toBytes());
    };
    expect(decodeBoard(withFirstGiven(5))).not.toBeNull();
    expect(decodeBoard(withFirstGiven(0))).toBeNull();
    expect(decodeBoard(withFirstGiven(10))).toBeNull();
  });

  it("메모 존재 비트가 1인데 마스크가 0이면 null", () => {
    const w = new BitWriter();
    w.write(1, 8);
    for (let i = 0; i < 81; i++) w.write(0, 2);
    w.write(1, 1);
    w.write(0, 9);
    for (let i = 1; i < 81; i++) w.write(0, 1);
    w.write(0, 20);
    expect(decodeBoard(toBase64Url(w.toBytes()))).toBeNull();
  });
});
