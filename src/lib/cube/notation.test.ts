import { describe, expect, it } from "vitest";
import { faceMove, keyToMove } from "./notation";

describe("faceMove", () => {
  it.each([
    ["R", false, 3, { axis: 0, layer: 2, turns: -1 }],
    ["L", false, 3, { axis: 0, layer: 0, turns: 1 }],
    ["U", true, 3, { axis: 1, layer: 2, turns: 1 }],
    ["B", false, 2, { axis: 2, layer: 0, turns: 1 }],
  ] as const)("%s prime=%s size=%i", (face, prime, size, move) => {
    expect(faceMove(face, prime, size)).toEqual(move);
  });
});

describe("keyToMove", () => {
  it("code 로 면을 고르고 Shift 면 반시계", () => {
    expect(keyToMove("KeyF", true, 3)).toEqual({ axis: 2, layer: 2, turns: 1 });
  });
  it.each(["KeyX", "Digit1", "ArrowUp"])("%s 는 null", (code) => {
    expect(keyToMove(code, false, 3)).toBeNull();
  });
});
