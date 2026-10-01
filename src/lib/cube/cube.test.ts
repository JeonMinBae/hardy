import { describe, expect, it } from "vitest";
import { applyMove, applyMoves, invertMove, isSolved, solvedCube, type Move } from "./cube";

const R: Move = { axis: 0, layer: 2, turns: -1 };
const U: Move = { axis: 1, layer: 2, turns: -1 };
const M: Move = { axis: 0, layer: 1, turns: 1 };

describe("solvedCube", () => {
  it.each([
    [2, 24],
    [3, 54],
  ] as const)("%i×%i 스티커 수", (size, count) => {
    expect(solvedCube(size).stickers).toHaveLength(count);
    expect(isSolved(solvedCube(size))).toBe(true);
  });
});

describe("applyMove", () => {
  it("한 번 돌리면 풀리지 않고, 같은 방향 4번이면 원래대로", () => {
    const once = applyMove(solvedCube(3), R);
    expect(isSolved(once)).toBe(false);
    expect(isSolved(applyMoves(solvedCube(3), [R, R, R, R]))).toBe(true);
  });

  it("R 은 앞면 오른쪽 줄을 윗면으로 올린다", () => {
    const moved = applyMove(solvedCube(3), R);
    const greenOnTop = moved.stickers.filter((s) => s.color === 2 && s.normal[1] === 1);
    expect(greenOnTop).toHaveLength(3);
    expect(greenOnTop.every((s) => s.pos[0] === 2)).toBe(true);
  });

  it("(R U R′ U′)×6 이면 원래대로", () => {
    const sexy = [R, U, invertMove(R), invertMove(U)];
    expect(isSolved(applyMoves(solvedCube(3), Array(6).fill(sexy).flat()))).toBe(true);
  });

  it("가운데 층 M 과 양옆 층을 같은 방향으로 돌리면 전체 회전이라 완성으로 본다", () => {
    const wholeX: Move[] = [0, 1, 2].map((layer) => ({ ...M, layer }));
    expect(isSolved(applyMoves(solvedCube(3), wholeX))).toBe(true);
  });

  it("원래 상태를 바꾸지 않는다", () => {
    const cube = solvedCube(2);
    applyMove(cube, { axis: 2, layer: 1, turns: 1 });
    expect(isSolved(cube)).toBe(true);
  });
});
