import { boardValues, isComplete } from "./board";
import type { Difficulty, Grid, Mode, Snapshot } from "./types";

export type InputMode = "normal" | "note";
export type Direction = "up" | "down" | "left" | "right";

interface CellContent {
  value: number;
  notes: number;
}

interface CellEdit {
  cell: number;
  before: CellContent;
  after: CellContent;
}

export interface GameState {
  snapshot: Snapshot;
  solution: Grid;
  selected: number | null;
  inputMode: InputMode;
  undo: CellEdit[];
  redo: CellEdit[];
  completed: boolean;
}

export type GameAction =
  | { type: "select"; cell: number }
  | { type: "move"; direction: Direction }
  | { type: "input"; digit: number }
  | { type: "erase" }
  | { type: "toggleInputMode" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "hint" };

export function createSnapshot(mode: Mode, difficulty: Difficulty, givens: Grid): Snapshot {
  return {
    mode,
    difficulty,
    givens,
    values: Array<number>(81).fill(0),
    hints: Array<boolean>(81).fill(false),
    notes: Array<number>(81).fill(0),
    elapsed: 0,
  };
}

/** 다시 풀기: 주어진 칸만 남기고 입력·힌트·메모·시간을 비운다 */
export const restartSnapshot = (s: Snapshot): Snapshot => createSnapshot(s.mode, s.difficulty, s.givens);

export function createGame(snapshot: Snapshot, solution: Grid): GameState {
  return {
    snapshot,
    solution,
    selected: null,
    inputMode: "normal",
    undo: [],
    redo: [],
    completed: isComplete(boardValues(snapshot), snapshot.mode),
  };
}

export const isEditable = (s: Snapshot, cell: number) => s.givens[cell] === 0 && !s.hints[cell];
export const canHint = (state: GameState) =>
  !state.completed && state.selected !== null && isEditable(state.snapshot, state.selected);
/** 확인창을 띄울지: 입력·힌트(values) 또는 메모가 있으면 진행 중이다 */
export const hasProgress = (s: Snapshot) => s.values.some((v) => v !== 0) || s.notes.some((n) => n !== 0);
export const hintCount = (s: Snapshot) => s.hints.filter(Boolean).length;

function withCell(state: GameState, cell: number, content: CellContent): GameState {
  const values = state.snapshot.values.slice();
  const notes = state.snapshot.notes.slice();
  values[cell] = content.value;
  notes[cell] = content.notes;
  const snapshot = { ...state.snapshot, values, notes };
  return { ...state, snapshot, completed: isComplete(boardValues(snapshot), snapshot.mode) };
}

function applyEdit(state: GameState, cell: number, after: CellContent): GameState {
  const before = { value: state.snapshot.values[cell], notes: state.snapshot.notes[cell] };
  if (before.value === after.value && before.notes === after.notes) return state;
  return { ...withCell(state, cell, after), undo: [...state.undo, { cell, before, after }], redo: [] };
}

const MOVES: Record<Direction, [number, number]> = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
const clamp = (n: number) => Math.min(8, Math.max(0, n));

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "select":
      return { ...state, selected: action.cell };
    case "move": {
      if (state.selected === null) return { ...state, selected: 0 };
      const [dr, dc] = MOVES[action.direction];
      const row = clamp(Math.floor(state.selected / 9) + dr);
      const col = clamp((state.selected % 9) + dc);
      return { ...state, selected: row * 9 + col };
    }
    case "toggleInputMode":
      return { ...state, inputMode: state.inputMode === "normal" ? "note" : "normal" };
    case "input":
    case "erase": {
      const cell = state.selected;
      if (state.completed || cell === null || !isEditable(state.snapshot, cell)) return state;
      const current = { value: state.snapshot.values[cell], notes: state.snapshot.notes[cell] };
      if (state.inputMode === "normal") {
        return applyEdit(state, cell, { ...current, value: action.type === "input" ? action.digit : 0 });
      }
      const notes = action.type === "input" ? current.notes ^ (1 << (action.digit - 1)) : 0;
      return applyEdit(state, cell, { ...current, notes });
    }
    case "undo": {
      const edit = state.undo.at(-1);
      if (state.completed || !edit) return state;
      return { ...withCell(state, edit.cell, edit.before), undo: state.undo.slice(0, -1), redo: [...state.redo, edit] };
    }
    case "redo": {
      const edit = state.redo.at(-1);
      if (state.completed || !edit) return state;
      return { ...withCell(state, edit.cell, edit.after), undo: [...state.undo, edit], redo: state.redo.slice(0, -1) };
    }
    case "hint": {
      const cell = state.selected;
      if (cell === null || !canHint(state)) return state;
      const hints = state.snapshot.hints.slice();
      hints[cell] = true;
      const next = withCell({ ...state, snapshot: { ...state.snapshot, hints } }, cell, {
        value: state.solution[cell],
        notes: 0,
      });
      // 힌트 칸은 되돌리기/다시하기로 바뀌면 안 되므로 그 칸의 기록을 버린다
      return {
        ...next,
        undo: state.undo.filter((e) => e.cell !== cell),
        redo: state.redo.filter((e) => e.cell !== cell),
      };
    }
  }
}
