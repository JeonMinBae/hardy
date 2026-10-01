import { describe, expect, it } from "vitest";
import { faceMove } from "./notation";
import { codeToMove, decodePractice, encodePractice, MAX_HISTORY, moveToCode, type PracticeSnapshot } from "./codec";

const R = faceMove("R", false, 3);
const sample: PracticeSnapshot = {
  size: 3,
  scramble: [R, faceMove("U", true, 3)],
  history: [{ axis: 0, layer: 1, turns: 1 }],
  moveCount: 4,
  elapsed: 75,
};

describe("move code", () => {
  it("모든 3×3 회전이 0~17 로 왕복한다", () => {
    for (let code = 0; code < 18; code++) expect(moveToCode(codeToMove(code, 3)!, 3)).toBe(code);
  });
  it("2×2 에 없는 층 코드는 null", () => {
    expect(codeToMove(12, 2)).toBeNull();
  });
});

describe("encodePractice / decodePractice", () => {
  it("왕복", () => {
    expect(decodePractice(encodePractice(sample)!)).toEqual(sample);
  });
  it("history 가 상한을 넘으면 null", () => {
    expect(encodePractice({ ...sample, history: Array(MAX_HISTORY + 1).fill(R) })).toBeNull();
  });
  it.each(["", "abc", "AAAA"])("손상된 값 %s 는 null", (text) => {
    expect(decodePractice(text)).toBeNull();
  });
});
