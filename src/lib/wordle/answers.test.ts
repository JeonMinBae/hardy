import { describe, expect, it } from "vitest";
import { ALLOWED, ANSWERS, answerForPuzzle, displayWord, isAllowed } from "./answers";
import { compose, decompose } from "./jamo";

const keysOf = (words: readonly string[]) => words.map((word) => decompose(word)?.join(""));

describe("ANSWERS", () => {
  it("학습용 어휘 목록 명사 중 7자모 302개이고, 출제 순서가 고정돼 있다", () => {
    expect(ANSWERS).toHaveLength(302);
    // 순서가 바뀌면 이미 나간 번호의 정답이 달라진다
    expect(ANSWERS.slice(0, 3)).toEqual(["땅콩", "마지막", "토요일"]);
  });

  it("모든 정답은 한글 음절로만 된 7자모이고, 자모열이 겹치지 않으며, 조합 규칙으로 제출할 수 있다", () => {
    const keys = keysOf(ANSWERS);
    expect(keys.filter((key) => [...(key ?? "")].length !== 7)).toEqual([]);
    expect(new Set(keys).size).toBe(ANSWERS.length);
    expect(ANSWERS.filter((word) => compose(decompose(word)!) === null)).toEqual([]);
  });
});

describe("ALLOWED", () => {
  it("모든 허용 단어는 7자모이고 자모열이 겹치지 않으며, 정답을 모두 포함한다", () => {
    const keys = keysOf(ALLOWED);
    expect(keys.filter((key) => [...(key ?? "")].length !== 7)).toEqual([]);
    expect(new Set(keys).size).toBe(ALLOWED.length);
    const allowed = new Set(ALLOWED);
    expect(ANSWERS.filter((word) => !allowed.has(word))).toEqual([]);
  });

  it("사전에 있는 단어만 허용한다", () => {
    expect(isAllowed(decompose("고등어")!)).toBe(true);
    expect(isAllowed([..."ㄱㅗㄷㅡㅇㅁㅓ"])).toBe(false); // 고등머
    expect(isAllowed([..."ㅊㅏㅣㄱㅅㅏㅇ"])).toBe(false); // 차ㅣㄱㅅㅏㅇ
  });
});

describe("answerForPuzzle", () => {
  it("N번 문제는 (N - 1) mod 길이 번째 단어이고, 목록을 다 쓰면 처음부터 돈다", () => {
    expect(answerForPuzzle(1)).toBe(ANSWERS[0]);
    expect(answerForPuzzle(302)).toBe(ANSWERS[301]);
    expect(answerForPuzzle(303)).toBe(ANSWERS[0]);
  });
});

describe("displayWord", () => {
  it("사전에 있는 자모열은 조합 규칙과 달라도 그 단어 표기를 쓴다", () => {
    expect(compose([..."ㄷㄷㅓㄱㄱㅜㄱ"])).toBe("떠꾹");
    expect(displayWord([..."ㄷㄷㅓㄱㄱㅜㄱ"])).toBe("떡국");
    expect(compose([..."ㄷㅐㅎㅏㄱㄱㅛ"])).toBe("대하꾜");
    expect(displayWord([..."ㄷㅐㅎㅏㄱㄱㅛ"])).toBe("대학교");
  });

  it("사전에 없으면 조합 규칙을 따르고, 조합할 수 없으면 null", () => {
    expect(displayWord([..."ㄱㅏㅇㅇㅏㅈㅜ"])).toBe("강아주");
    expect(displayWord([..."ㄱㅏㄴㅁㄹㅏㄱ"])).toBeNull();
  });
});
