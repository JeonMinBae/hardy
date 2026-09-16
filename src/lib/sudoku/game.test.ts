import { describe, expect, it } from "vitest";
import {
  canHint,
  createGame,
  createSnapshot,
  gameReducer,
  hasProgress,
  restartSnapshot,
  type GameAction,
  type GameState,
} from "./game";
import { SAMPLE_PUZZLE, SAMPLE_SOLUTION, parseGrid } from "./testing";

// SAMPLE_PUZZLE: 0번 칸은 주어진 칸(5), 2·3번 칸은 빈칸(정답 4·6)
const solution = parseGrid(SAMPLE_SOLUTION);
const newGame = () => createGame(createSnapshot("normal", "medium", parseGrid(SAMPLE_PUZZLE)), solution);
const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state);
const select = (cell: number): GameAction => ({ type: "select", cell });
const input = (digit: number): GameAction => ({ type: "input", digit });
const TOGGLE: GameAction = { type: "toggleInputMode" };
const ERASE: GameAction = { type: "erase" };
const UNDO: GameAction = { type: "undo" };
const REDO: GameAction = { type: "redo" };
const HINT: GameAction = { type: "hint" };

describe("gameReducer", () => {
  it("주어진 칸에는 입력·메모·힌트가 무시된다", () => {
    const state = run(newGame(), select(0));
    expect(run(state, input(1), TOGGLE, input(2), HINT).snapshot).toEqual(state.snapshot);
    expect(canHint(state)).toBe(false);
  });

  it("숫자 입력은 메모를 지우지 않는다", () => {
    const state = run(newGame(), select(2), TOGGLE, input(1), input(3), TOGGLE, input(1));
    expect(state.snapshot.values[2]).toBe(1);
    expect(state.snapshot.notes[2]).toBe(0b101);
  });

  it("같은 숫자를 다시 넣으면 기록이 늘지 않는다", () => {
    expect(run(newGame(), select(2), input(4), input(4)).undo).toHaveLength(1);
  });

  it("지우기는 현재 모드의 것만 지운다", () => {
    const filled = run(newGame(), select(2), TOGGLE, input(1), TOGGLE, input(4));
    const erasedValue = run(filled, ERASE);
    const erasedNotes = run(filled, TOGGLE, ERASE);
    expect([erasedValue.snapshot.values[2], erasedValue.snapshot.notes[2]]).toEqual([0, 0b1]);
    expect([erasedNotes.snapshot.values[2], erasedNotes.snapshot.notes[2]]).toEqual([4, 0]);
  });

  it("되돌리기/다시하기는 입력과 메모를 복구하고, 새 편집은 다시하기 기록을 버린다", () => {
    const state = run(newGame(), select(2), input(4), TOGGLE, input(7));
    const undone = run(state, UNDO, UNDO);
    expect([undone.snapshot.values[2], undone.snapshot.notes[2]]).toEqual([0, 0]);
    const redone = run(undone, REDO);
    expect([redone.snapshot.values[2], redone.snapshot.notes[2]]).toEqual([4, 0]);
    expect(run(redone, input(1)).redo).toEqual([]);
  });

  it("힌트는 정답을 채우고 메모와 그 칸의 기록을 지우며, 되돌릴 수 없다", () => {
    const state = run(newGame(), select(2), input(9), TOGGLE, input(3), TOGGLE, select(3), input(1), select(2), HINT);
    expect(state.snapshot.values[2]).toBe(4);
    expect(state.snapshot.hints[2]).toBe(true);
    expect(state.snapshot.notes[2]).toBe(0);
    expect(state.undo.map((e) => e.cell)).toEqual([3]);

    const undone = run(state, UNDO, UNDO);
    expect(undone.snapshot.values[2]).toBe(4);
    expect(undone.snapshot.values[3]).toBe(0);
    expect(run(state, input(1), ERASE).snapshot.values[2]).toBe(4);
  });

  it("힌트 칸은 다시하기로도 바뀌지 않는다", () => {
    const state = run(newGame(), select(2), input(9), UNDO, HINT, REDO);
    expect(state.snapshot.values[2]).toBe(4);
    expect(state.snapshot.hints[2]).toBe(true);
    expect(state.redo).toEqual([]);
  });

  it("다 채우면 완성되고 편집 동작이 잠긴다", () => {
    let state = newGame();
    state.snapshot.givens.forEach((given, cell) => {
      if (given === 0) state = run(state, select(cell), input(solution[cell]));
    });
    expect(state.completed).toBe(true);
    const locked = run(state, select(2), ERASE, UNDO, HINT, TOGGLE, input(1));
    expect(locked.snapshot).toEqual(state.snapshot);
    expect(canHint(locked)).toBe(false);
  });

  it("방향키 이동은 가장자리에서 멈추고, 선택이 없으면 0번 칸", () => {
    const move = (direction: "up" | "down" | "left" | "right"): GameAction => ({ type: "move", direction });
    expect(run(newGame(), move("down")).selected).toBe(0);
    expect(run(newGame(), select(8), move("right")).selected).toBe(8);
    expect(run(newGame(), select(80), move("down")).selected).toBe(80);
    expect(run(newGame(), select(40), move("left"), move("up")).selected).toBe(30);
  });
});

describe("snapshot helpers", () => {
  it("메모만 있어도 진행 중이다", () => {
    expect(hasProgress(newGame().snapshot)).toBe(false);
    expect(hasProgress(run(newGame(), select(2), TOGGLE, input(1)).snapshot)).toBe(true);
  });

  it("다시 풀기는 주어진 칸만 남긴다", () => {
    const played = run(newGame(), select(2), input(4), select(3), HINT).snapshot;
    expect(restartSnapshot({ ...played, elapsed: 50 })).toEqual(newGame().snapshot);
  });

  it("완성된 스냅샷으로 만들면 완성 상태", () => {
    const snapshot = createSnapshot("normal", "medium", parseGrid(SAMPLE_PUZZLE));
    snapshot.values = snapshot.givens.map((given, i) => (given ? 0 : solution[i]));
    expect(createGame(snapshot, solution).completed).toBe(true);
  });
});
