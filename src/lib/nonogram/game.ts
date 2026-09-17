import { MAX_HINTS } from "./codec";
import { lockAxis, strokeCells, strokeTarget, type Axis } from "./stroke";
import { CROSSED, EMPTY, FILLED, type CellState, type Mode, type Size, type Snapshot } from "./types";

interface Change {
  index: number;
  from: CellState;
  to: CellState;
}

interface Stroke {
  start: number;
  target: CellState;
  /** 시작 칸을 벗어나기 전에는 null */
  axis: Axis | null;
  /** 획 시작 전 칸 상태. 끝날 때 비교해 되돌리기 기록을 만들고, 취소하면 이 상태로 돌린다 */
  before: CellState[];
  /** 시작 칸을 칠하면서 힌트 강조가 지워지므로, 취소할 때 되살릴 강조 */
  beforeHighlight: number[];
}

export interface GameState {
  size: Size;
  solution: readonly boolean[];
  snapshot: Snapshot;
  mode: Mode;
  stroke: Stroke | null;
  undo: Change[][];
  redo: Change[][];
  /** 힌트로 강조한 틀린 칸. 칸이 바뀌면 비운다 */
  highlight: number[];
  completed: boolean;
}

export type GameAction =
  | { type: "strokeStart"; cell: number }
  /** row·col 은 판 밖(음수, size 이상)일 수 있다 */
  | { type: "strokeMove"; row: number; col: number }
  | { type: "strokeEnd" }
  /** 두 번째 손가락이 닿으면 진행 중인 획을 없던 일로 한다 */
  | { type: "strokeCancel" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "hint" }
  | { type: "setMode"; mode: Mode };

export const emptySnapshot = (size: Size): Snapshot => ({ cells: Array<CellState>(size * size).fill(EMPTY), elapsed: 0, hints: 0 });

/** 칠함 칸이 정답과 같으면 완성. ✕와 빈칸은 구분하지 않는다 */
export const isComplete = (cells: readonly CellState[], solution: readonly boolean[]) => cells.every((state, i) => (state === FILLED) === solution[i]);

/** 정답이 빈칸인데 칠한 칸, 정답이 칠함인데 ✕한 칸. 표시 안 한 빈칸은 틀린 칸이 아니다 */
export const wrongCells = (cells: readonly CellState[], solution: readonly boolean[]) =>
  cells.flatMap((state, i) => ((state === FILLED && !solution[i]) || (state === CROSSED && solution[i]) ? [i] : []));

export const hasProgress = (snapshot: Snapshot) => snapshot.hints > 0 || snapshot.cells.some((state) => state !== EMPTY);

export function createGame(size: Size, solution: readonly boolean[], snapshot: Snapshot): GameState {
  return { size, solution, snapshot, mode: "fill", stroke: null, undo: [], redo: [], highlight: [], completed: isComplete(snapshot.cells, solution) };
}

function paint(state: GameState, indices: readonly number[], target: CellState): GameState {
  if (indices.every((i) => state.snapshot.cells[i] === target)) return state;
  const cells = [...state.snapshot.cells];
  for (const i of indices) cells[i] = target;
  return { ...state, snapshot: { ...state.snapshot, cells }, highlight: [] };
}

function applyChanges(state: GameState, changes: readonly Change[], side: "from" | "to"): GameState {
  const cells = [...state.snapshot.cells];
  for (const change of changes) cells[change.index] = change[side];
  return { ...state, snapshot: { ...state.snapshot, cells }, highlight: [], completed: isComplete(cells, state.solution) };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  const { stroke } = state;
  switch (action.type) {
    case "strokeStart": {
      if (state.completed || stroke) return state;
      const target = strokeTarget(state.mode, state.snapshot.cells[action.cell]);
      return paint({ ...state, stroke: { start: action.cell, target, axis: null, before: state.snapshot.cells, beforeHighlight: state.highlight } }, [action.cell], target);
    }
    case "strokeMove": {
      if (!stroke) return state;
      const axis = stroke.axis ?? lockAxis(state.size, stroke.start, action.row, action.col);
      if (!axis) return state;
      const locked = stroke.axis ? state : { ...state, stroke: { ...stroke, axis } };
      return paint(locked, strokeCells(state.size, stroke.start, axis, action.row, action.col), stroke.target);
    }
    case "strokeEnd": {
      if (!stroke) return state;
      const { cells } = state.snapshot;
      const changes = stroke.before.flatMap((from, index) => (from === cells[index] ? [] : [{ index, from, to: cells[index] }]));
      if (changes.length === 0) return { ...state, stroke: null };
      // 판정은 획이 끝날 때 한다
      return { ...state, stroke: null, undo: [...state.undo, changes], redo: [], completed: isComplete(cells, state.solution) };
    }
    case "strokeCancel":
      return stroke ? { ...state, snapshot: { ...state.snapshot, cells: stroke.before }, highlight: stroke.beforeHighlight, stroke: null } : state;
    case "undo": {
      if (state.completed || stroke || state.undo.length === 0) return state;
      const changes = state.undo[state.undo.length - 1];
      return { ...applyChanges(state, changes, "from"), undo: state.undo.slice(0, -1), redo: [...state.redo, changes] };
    }
    case "redo": {
      if (state.completed || stroke || state.redo.length === 0) return state;
      const changes = state.redo[state.redo.length - 1];
      return { ...applyChanges(state, changes, "to"), undo: [...state.undo, changes], redo: state.redo.slice(0, -1) };
    }
    case "hint": {
      if (state.completed || stroke) return state;
      const wrong = wrongCells(state.snapshot.cells, state.solution);
      // 틀린 칸이 없으면 횟수를 늘리지 않는다. 안내는 화면이 띄운다
      if (wrong.length === 0) return state;
      return { ...state, highlight: wrong, snapshot: { ...state.snapshot, hints: Math.min(MAX_HINTS, state.snapshot.hints + 1) } };
    }
    case "setMode":
      return state.completed || stroke || state.mode === action.mode ? state : { ...state, mode: action.mode };
  }
}
