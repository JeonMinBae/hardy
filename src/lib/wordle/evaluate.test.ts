import { describe, expect, it } from "vitest";
import { evaluateGuess, keyMarks } from "./evaluate";

const GANGAJI = [..."ㄱㅏㅇㅇㅏㅈㅣ"]; // 강아지
const GAEGURI = [..."ㄱㅏㅣㄱㅜㄹㅣ"]; // 개구리
const HAETSAL = [..."ㅎㅏㅣㅅㅅㅏㄹ"]; // 햇살

describe("evaluateGuess", () => {
  it("같은 자리는 초록, 다른 자리에 있으면 노랑, 없으면 회색", () => {
    expect(evaluateGuess([..."ㄱㅏㄴㅇㅣㅈㅏ"], GANGAJI)).toEqual(["correct", "correct", "absent", "correct", "present", "correct", "present"]);
  });

  it("정답보다 많이 입력한 자모는 남은 개수만큼만 노랑", () => {
    // 개구리에 ㄱ은 둘, 1번째 칸이 초록이면 남은 하나로 2번째 ㄱ만 노랑
    expect(evaluateGuess([..."ㄱㄱㄱㅜㄹㅜㅁ"], GAEGURI)).toEqual(["correct", "present", "absent", "present", "present", "absent", "absent"]);
  });

  it("초록이 먼저 개수를 차지한다", () => {
    // 개구리의 ㅜ는 5번째 칸 하나: 5번째가 초록이면 3번째 ㅜ는 회색
    expect(evaluateGuess([..."ㅁㅗㅜㅁㅜㄹㅗ"], GAEGURI)).toEqual(["absent", "absent", "absent", "absent", "correct", "correct", "absent"]);
    // 햇살의 ㅅ 두 개 중 4번째 칸이 초록이면 남은 하나로 첫 ㅅ만 노랑
    expect(evaluateGuess([..."ㅅㅏㅅㅅㅏㅣㄹ"], HAETSAL)).toEqual(["present", "correct", "absent", "correct", "present", "present", "correct"]);
  });
});

describe("keyMarks", () => {
  it("가장 좋은 판정을 유지하고 더 나쁜 판정으로 바뀌지 않는다", () => {
    const marks = keyMarks([[..."ㅈㅈㅏㄹㅏㅇㅣ"], [..."ㄱㅏㄴㅇㅣㅈㅏ"]], GANGAJI);
    expect(marks.get("ㅈ")).toBe("correct"); // 노랑 → 초록
    expect(marks.get("ㅏ")).toBe("correct"); // 같은 줄의 노랑과 초록 중 초록
    expect(marks.get("ㄹ")).toBe("absent");
    expect(marks.has("ㅎ")).toBe(false);
  });
});
