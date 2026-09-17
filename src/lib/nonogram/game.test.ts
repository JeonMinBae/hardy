import { describe, expect, it } from "vitest";
import { MAX_HINTS } from "./codec";
import { createGame, emptySnapshot, gameReducer, hasProgress, isComplete, wrongCells, type GameAction, type GameState } from "./game";
import { CROSSED, EMPTY, FILLED, type CellState } from "./types";

// 10×10, 정답은 0행 왼쪽 세 칸(0, 1, 2)만 칠함
const SOLUTION = Array.from({ length: 100 }, (_, i) => i < 3);
const newGame = () => createGame(10, SOLUTION, emptySnapshot(10));
const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state);
const start = (cell: number): GameAction => ({ type: "strokeStart", cell });
const move = (row: number, col: number): GameAction => ({ type: "strokeMove", row, col });
const END: GameAction = { type: "strokeEnd" };
const CANCEL: GameAction = { type: "strokeCancel" };
const UNDO: GameAction = { type: "undo" };
const REDO: GameAction = { type: "redo" };
const HINT: GameAction = { type: "hint" };
const CROSS_MODE: GameAction = { type: "setMode", mode: "cross" };
const FILL_MODE: GameAction = { type: "setMode", mode: "fill" };
const row0 = (state: GameState) => state.snapshot.cells.slice(0, 10);
const cellsOf = (text: string) => [...text].map((ch): CellState => (ch === "#" ? FILLED : ch === "x" ? CROSSED : EMPTY));

describe("획", () => {
  it("탭은 시작 칸 하나만 바꾸고, 끌면 사이 칸까지 목표 상태로 바꾼다", () => {
    expect(row0(run(newGame(), start(5), END))).toEqual(cellsOf(".....#...."));
    expect(row0(run(newGame(), start(1), move(0, 4), END))).toEqual(cellsOf(".####....."));
  });

  it("지나가는 칸은 원래 상태와 상관없이 모두 덮어쓴다", () => {
    const crossed = run(newGame(), CROSS_MODE, start(2), END, FILL_MODE); // 2번 칸 ✕, 칠하기 모드로 복귀
    expect(row0(run(crossed, start(0), move(0, 4), END))).toEqual(cellsOf("#####....."));
    // 칠함 칸에서 시작하면 지우기: 지나가는 ✕도 빈칸이 된다
    const mixed = run(newGame(), start(0), END, CROSS_MODE, start(1), END, FILL_MODE); // # x . . .
    expect(row0(run(mixed, start(0), move(0, 3), END))).toEqual(cellsOf(".........."));
  });

  it("되돌아와도 이미 바뀐 칸은 유지된다", () => {
    expect(row0(run(newGame(), start(0), move(0, 5), move(0, 1), END))).toEqual(cellsOf("######...."));
  });

  it("방향이 정해지면 다른 축 움직임은 투영한다", () => {
    // 두 번째 이동은 세로 차이가 더 커서, 방향을 다시 정하면 열로 바뀐다
    const state = run(newGame(), start(0), move(0, 3), move(6, 1), END);
    expect(row0(state)).toEqual(cellsOf("####......"));
    expect(state.snapshot.cells[10]).toBe(EMPTY);
    expect(state.snapshot.cells[60]).toBe(EMPTY);
  });

  it("획 하나가 되돌리기 한 단계다", () => {
    const state = run(newGame(), start(0), move(0, 4), END, start(20), END);
    expect(state.undo).toHaveLength(2);
    expect(row0(run(state, UNDO))).toEqual(cellsOf("#####....."));
    expect(row0(run(state, UNDO, UNDO))).toEqual(cellsOf(".........."));
  });

  it("취소하면 획 전 상태로 돌아가고 기록하지 않는다", () => {
    const state = run(newGame(), start(0), move(0, 5), CANCEL);
    expect(row0(state)).toEqual(cellsOf(".........."));
    expect(state.undo).toEqual([]);
    expect(state.stroke).toBeNull();
  });
});

describe("되돌리기/다시하기", () => {
  it("획 단위로 되돌리고 다시하며, 새 획은 다시하기 기록을 버린다", () => {
    const two = run(newGame(), start(10), END, start(20), move(2, 3), END);
    const undone = run(two, UNDO);
    expect(undone.snapshot.cells.slice(20, 24)).toEqual(cellsOf("...."));
    expect(undone.snapshot.cells[10]).toBe(FILLED);
    expect(run(undone, REDO).snapshot.cells.slice(20, 24)).toEqual(cellsOf("####"));
    expect(run(undone, start(30), END).redo).toEqual([]);
  });
});

describe("완성", () => {
  it("✕가 남아 있어도 칠함이 정답과 같으면 획이 끝날 때 완성되고 잠긴다", () => {
    const crossed = run(newGame(), CROSS_MODE, start(9), END, FILL_MODE);
    const dragging = run(crossed, start(0), move(0, 2));
    expect(dragging.completed).toBe(false); // 끄는 도중에는 판정하지 않는다
    const done = run(dragging, END);
    expect(done.completed).toBe(true);
    for (const action of [start(50), UNDO, HINT, CROSS_MODE]) expect(run(done, action)).toBe(done);
  });

  it("칠함이 하나라도 다르면 미완성", () => {
    expect(isComplete(cellsOf("###.#").concat(Array(95).fill(EMPTY)), SOLUTION)).toBe(false);
    expect(isComplete(cellsOf("##x").concat(Array(97).fill(EMPTY)), SOLUTION)).toBe(false);
  });

  it("완성 상태로 만든 게임은 처음부터 잠겨 있다", () => {
    const cells = Array.from({ length: 100 }, (_, i): CellState => (i < 3 ? FILLED : i === 99 ? CROSSED : EMPTY));
    const restored = createGame(10, SOLUTION, { cells, elapsed: 30, hints: 0 });
    expect(restored.completed).toBe(true);
    expect(run(restored, start(50), END)).toBe(restored);
  });
});

describe("힌트", () => {
  it("잘못 칠한 칸과 잘못 ✕한 칸만 강조하고 횟수를 늘린다", () => {
    // 0번 ✕(정답 칠함), 5번 칠함(정답 빈칸), 1번 빈칸(정답 칠함 — 틀린 칸 아님)
    const state = run(newGame(), CROSS_MODE, start(0), END, FILL_MODE, start(5), END);
    expect(wrongCells(state.snapshot.cells, SOLUTION)).toEqual([0, 5]);
    const hinted = run(state, HINT);
    expect(hinted.highlight).toEqual([0, 5]);
    expect(hinted.snapshot.hints).toBe(1);
    expect(run(hinted, start(70), END).highlight).toEqual([]); // 칸이 바뀌면 강조를 지운다
  });

  it("획을 취소하면 강조도 그대로 남는다", () => {
    const hinted = run(newGame(), start(5), END, HINT);
    const cancelled = run(hinted, start(70), CANCEL);
    expect(cancelled.highlight).toEqual([5]);
    expect(cancelled.snapshot.cells).toEqual(hinted.snapshot.cells);
  });

  it("틀린 칸이 없으면 상태를 바꾸지 않는다", () => {
    const state = run(newGame(), start(0), END);
    expect(run(state, HINT)).toBe(state);
  });

  it("횟수는 최대값에서 멈춘다", () => {
    const state = run(createGame(10, SOLUTION, { ...emptySnapshot(10), hints: MAX_HINTS }), start(50), END);
    expect(run(state, HINT).snapshot.hints).toBe(MAX_HINTS);
  });
});

it("hasProgress 는 표시한 칸이나 힌트 사용이 있으면 참", () => {
  expect(hasProgress(emptySnapshot(10))).toBe(false);
  expect(hasProgress({ ...emptySnapshot(10), hints: 1 })).toBe(true);
  expect(hasProgress(run(newGame(), CROSS_MODE, start(0), END).snapshot)).toBe(true);
});
