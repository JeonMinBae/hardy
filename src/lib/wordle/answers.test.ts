import { describe, expect, it } from "vitest";
import { ANSWERS, answerForPuzzle, displayWord } from "./answers";
import { compose, decompose } from "./jamo";

describe("ANSWERS", () => {
  it("학습용 어휘 목록 명사 중 6자모 995개이고, 출제 순서가 고정돼 있다", () => {
    expect(ANSWERS).toHaveLength(995);
    // 순서가 바뀌면 이미 나간 번호의 정답이 달라진다
    expect(ANSWERS.slice(0, 3)).toEqual(["감동", "발전", "긴급"]);
  });

  it("모든 정답은 한글 음절로만 된 6자모이고, 자모열이 겹치지 않으며, 조합 규칙으로 제출할 수 있다", () => {
    const keys = ANSWERS.map((word) => decompose(word)?.join(""));
    expect(keys.filter((key) => key?.length !== 6)).toEqual([]);
    expect(new Set(keys).size).toBe(ANSWERS.length);
    expect(ANSWERS.filter((word) => compose(decompose(word)!) === null)).toEqual([]);
  });
});

describe("answerForPuzzle", () => {
  it("N번 문제는 (N - 1) mod 길이 번째 단어이고, 목록을 다 쓰면 처음부터 돈다", () => {
    expect(answerForPuzzle(1)).toBe(ANSWERS[0]);
    expect(answerForPuzzle(995)).toBe(ANSWERS[994]);
    expect(answerForPuzzle(996)).toBe(ANSWERS[0]);
  });
});

describe("displayWord", () => {
  it("정답 목록에 있는 자모열은 조합 규칙과 달라도 그 단어 표기를 쓴다", () => {
    expect(compose([..."ㄱㅏㄱㄱㅏㄱ"])).toBe("가깍");
    expect(displayWord([..."ㄱㅏㄱㄱㅏㄱ"])).toBe("각각");
    expect(compose([..."ㄷㅏㅂㅂㅕㄴ"])).toBe("다뼌");
    expect(displayWord([..."ㄷㅏㅂㅂㅕㄴ"])).toBe("답변");
  });

  it("목록에 없으면 조합 규칙을 따르고, 조합할 수 없으면 null", () => {
    expect(displayWord([..."ㄱㅏㄱㄱㅏㅇ"])).toBe("가깡");
    expect(displayWord([..."ㄱㅏㄴㅁㄹㅏ"])).toBeNull();
  });
});
