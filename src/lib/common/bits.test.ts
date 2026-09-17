import { describe, expect, it } from "vitest";
import { BitReader, BitWriter, fromBase64Url, toBase64Url } from "./bits";

describe("BitWriter / BitReader", () => {
  it("쓴 순서와 비트 수대로 다시 읽는다", () => {
    const w = new BitWriter();
    w.write(1, 8);
    w.write(2, 2);
    w.write(0b1011, 4);
    w.write(1_000_000, 20);
    const r = new BitReader(w.toBytes());
    expect([r.read(8), r.read(2), r.read(4), r.read(20)]).toEqual([1, 2, 0b1011, 1_000_000]);
    expect(r.isAtPaddedEnd()).toBe(true);
  });

  it("비트가 모자라면 RangeError", () => {
    const r = new BitReader(Uint8Array.of(0xff));
    r.read(6);
    expect(() => r.read(3)).toThrow(RangeError);
  });

  it("남은 바이트가 있거나 패딩 비트가 0 이 아니면 끝이 아니다", () => {
    const extraByte = new BitReader(Uint8Array.of(0, 0));
    extraByte.read(6);
    expect(extraByte.isAtPaddedEnd()).toBe(false);
    const dirtyPadding = new BitReader(Uint8Array.of(0b00000001));
    dirtyPadding.read(6);
    expect(dirtyPadding.isAtPaddedEnd()).toBe(false);
  });
});

describe("base64url", () => {
  it("왕복 변환하고 URL 안전 문자만 쓴다", () => {
    const bytes = Uint8Array.of(0xfb, 0xff, 0x00, 0x7f);
    const text = toBase64Url(bytes);
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(fromBase64Url(text)).toEqual(bytes);
  });

  it.each(["", "ab+/", "abcde", "a=="])("%s 는 null", (text) => {
    expect(fromBase64Url(text)).toBeNull();
  });
});
