import { describe, expect, it } from "vitest";
import { completedUnitCells, conflictCells, isComplete, remainingCounts } from "./board";
import { SAMPLE_SOLUTION, parseGrid } from "./testing";

const solved = parseGrid(SAMPLE_SOLUTION);
const emptyGrid = () => Array<number>(81).fill(0);

describe("completedUnitCells", () => {
  it("중복 없이 채운 행의 칸만 초록", () => {
    const board = emptyGrid();
    for (let c = 0; c < 9; c++) board[c] = solved[c];
    const green = completedUnitCells(board, "normal");
    expect(green.slice(0, 9).every(Boolean)).toBe(true);
    expect(green.slice(9).some(Boolean)).toBe(false);
  });

  it("정답과 달라도 중복만 없으면 초록", () => {
    const board = emptyGrid();
    for (let c = 0; c < 9; c++) board[c] = c + 1; // 0행 정답은 534678912
    expect(completedUnitCells(board, "normal")[0]).toBe(true);
  });

  it("중복이 있으면 초록이 아니다", () => {
    const board = emptyGrid();
    [1, 1, 3, 4, 5, 6, 7, 8, 9].forEach((v, c) => (board[c] = v));
    expect(completedUnitCells(board, "normal").some(Boolean)).toBe(false);
  });

  it("대각선은 X 모드에서만 초록", () => {
    const board = emptyGrid();
    for (let r = 0; r < 9; r++) board[r * 10] = r + 1;
    expect(completedUnitCells(board, "normal")[0]).toBe(false);
    expect(completedUnitCells(board, "x")[0]).toBe(true);
    expect(completedUnitCells(board, "x")[80]).toBe(true);
  });
});

describe("isComplete", () => {
  it("완성된 판", () => {
    expect(isComplete(solved, "normal")).toBe(true);
  });

  it("일반 해가 대각선을 어기면 X 모드에선 미완성", () => {
    expect(isComplete(solved, "x")).toBe(false);
  });

  it("빈칸이나 중복이 있으면 미완성", () => {
    const withEmpty = solved.slice();
    withEmpty[40] = 0;
    const swapped = solved.slice();
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]]; // 행은 그대로, 0·1열에 중복
    expect(isComplete(withEmpty, "normal")).toBe(false);
    expect(isComplete(swapped, "normal")).toBe(false);
  });
});

it("remainingCounts 는 0 미만으로 내려가지 않는다", () => {
  const board = emptyGrid();
  for (let i = 0; i < 10; i++) board[i] = 5;
  board[20] = 3;
  const counts = remainingCounts(board);
  expect(counts[5]).toBe(0);
  expect(counts[3]).toBe(8);
  expect(counts[1]).toBe(9);
});

describe("conflictCells", () => {
  it("같은 행의 중복은 양쪽 모두 표시", () => {
    const board = emptyGrid();
    board[0] = 5;
    board[3] = 5;
    const conflicts = conflictCells(board, "normal");
    expect(conflicts[0]).toBe(true);
    expect(conflicts[3]).toBe(true);
    expect(conflicts.filter(Boolean)).toHaveLength(2);
  });

  it("중복이 없으면 아무 칸도 표시하지 않는다", () => {
    expect(conflictCells(solved, "normal").some(Boolean)).toBe(false);
  });

  it("대각선 중복은 X 모드에서만 표시", () => {
    const board = emptyGrid();
    board[0] = 7; // 좌상 대각선
    board[40] = 7; // 같은 대각선, 다른 행·열·박스
    expect(conflictCells(board, "normal").some(Boolean)).toBe(false);
    expect(conflictCells(board, "x")[0]).toBe(true);
  });
});
