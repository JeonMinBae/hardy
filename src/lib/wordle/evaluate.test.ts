import { describe, expect, it } from "vitest";
import { evaluateGuess, keyMarks } from "./evaluate";

const GYESAN = [..."ㄱㅕㅣㅅㅏㄴ"]; // 계산
const NALSSI = [..."ㄴㅏㄹㅅㅅㅣ"]; // 날씨

describe("evaluateGuess", () => {
  it("같은 자리는 초록, 다른 자리에 있으면 노랑, 없으면 회색", () => {
    expect(evaluateGuess([..."ㄱㅏㄴㅅㅣㄹ"], GYESAN)).toEqual(["correct", "present", "present", "correct", "present", "absent"]);
  });

  it("정답보다 많이 입력한 자모는 남은 개수만큼만 노랑", () => {
    // 계산에 ㅅ은 하나: 앞의 ㅅ만 노랑
    expect(evaluateGuess([..."ㅅㅅㅗㄹㅗㅇ"], GYESAN)).toEqual(["present", "absent", "absent", "absent", "absent", "absent"]);
  });

  it("초록이 먼저 개수를 차지한다", () => {
    // 계산의 ㅏ는 5번째 칸 하나: 5번째가 초록이면 3번째 ㅏ는 회색
    expect(evaluateGuess([..."ㅅㅅㅏㄹㅏㅇ"], GYESAN)).toEqual(["present", "absent", "absent", "absent", "correct", "absent"]);
    // 날씨의 ㅅ 두 개 중 4번째 칸이 초록이면 남은 하나로 첫 ㅅ만 노랑
    expect(evaluateGuess([..."ㅅㅏㅅㅅㅏㅣ"], NALSSI)).toEqual(["present", "correct", "absent", "correct", "absent", "correct"]);
  });
});

describe("keyMarks", () => {
  it("가장 좋은 판정을 유지하고 더 나쁜 판정으로 바뀌지 않는다", () => {
    const marks = keyMarks([[..."ㅅㅅㅏㄹㅏㅇ"], [..."ㄱㅏㄴㅅㅏㄴ"]], GYESAN);
    expect(marks.get("ㅅ")).toBe("correct"); // 노랑 → 초록
    expect(marks.get("ㅏ")).toBe("correct"); // 같은 줄의 회색과 초록 중 초록
    expect(marks.get("ㄹ")).toBe("absent");
    expect(marks.has("ㅎ")).toBe(false);
  });
});
