import { describe, expect, it } from "vitest";
import { CONSONANTS, VOWELS } from "./jamo";
import { DELETE_KEY, ENTER_KEY, KEYBOARD_ROWS, jamoForKey } from "./keyboard";

describe("jamoForKey", () => {
  it.each([
    ["KeyR", false, "ㄱ"],
    ["KeyM", false, "ㅡ"],
    ["KeyR", true, "ㄱㄱ"],
    ["KeyT", true, "ㅅㅅ"],
    ["KeyO", false, "ㅏㅣ"],
    ["KeyP", false, "ㅓㅣ"],
    ["KeyO", true, "ㅑㅣ"],
    ["KeyP", true, "ㅕㅣ"],
    ["KeyK", true, "ㅏ"], // Shift 자리가 없는 키는 그대로
  ])("%s (Shift %s) → %s", (code, shift, jamo) => {
    expect(jamoForKey(code, shift)).toEqual([...jamo]);
  });

  it("자모 키가 아니면 null", () => {
    expect(jamoForKey("Digit1", false)).toBeNull();
    expect(jamoForKey("Enter", false)).toBeNull();
  });

  it("26개 문자 키가 모두 기본 자모만 넣는다", () => {
    const basic = new Set<string>([...CONSONANTS, ...VOWELS]);
    for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
      for (const shift of [false, true]) expect(jamoForKey(`Key${letter}`, shift)!.every((j) => basic.has(j))).toBe(true);
    }
  });
});

it("화면 키보드는 기본 자모 24종을 한 번씩 담고 입력·삭제 키가 있다", () => {
  const keys = KEYBOARD_ROWS.flat();
  const jamo = keys.filter((key) => key !== ENTER_KEY && key !== DELETE_KEY);
  expect(jamo).toHaveLength(24);
  expect(new Set(jamo)).toEqual(new Set([...CONSONANTS, ...VOWELS]));
  expect(keys).toContain(ENTER_KEY);
  expect(keys).toContain(DELETE_KEY);
});
