"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { boardValues, remainingCounts } from "@/lib/sudoku/board";
import { DIFFICULTY_LABEL, formatElapsed, MODE_LABEL } from "@/lib/sudoku/display";
import { canHint, createGame, gameReducer, hasProgress, hintCount } from "@/lib/sudoku/game";
import type { Difficulty, Grid, Mode, Snapshot } from "@/lib/sudoku/types";
import { Board } from "./Board";
import { celebrate } from "./celebrate";
import { Dialog } from "./Dialog";
import { NumberPad } from "./NumberPad";
import { useGameTimer } from "./useGameTimer";
import { useKeyboardControls } from "./useKeyboardControls";

type PendingAction = "newGame" | "restart" | "changeSettings";

const CONFIRM_MESSAGE: Record<PendingAction, string> = {
  newGame: "풀던 내용이 사라집니다. 새 게임을 시작할까요?",
  restart: "입력한 숫자·메모·힌트와 시간이 초기화됩니다. 처음부터 다시 풀까요?",
  changeSettings: "풀던 내용이 사라집니다. 설정을 바꿀까요?",
};

interface Props {
  initialSnapshot: Snapshot;
  solution: Grid;
  onPersist: (snapshot: Snapshot) => void;
  onNewGame: (mode: Mode, difficulty: Difficulty) => void;
  onRestart: (snapshot: Snapshot, solution: Grid) => void;
  onChangeSettings: () => void;
}

const BUTTON = "rounded-md bg-slate-100 px-2 py-2 text-sm disabled:opacity-40 dark:bg-slate-800";

export function GameScreen({ initialSnapshot, solution, onPersist, onNewGame, onRestart, onChangeSettings }: Props) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createGame(initialSnapshot, solution));
  // 타이머 effect 가 URL 쓰기 effect 보다 먼저 선언돼야 완성 시점의 시간이 맞는다
  const { seconds, getSeconds } = useGameTimer(initialSnapshot.elapsed, !state.completed);
  // 완성 URL 로 들어온 경우 폭죽을 터뜨리지 않는다
  const [completedOnOpen] = useState(state.completed);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const { snapshot } = state;
  const board = boardValues(snapshot);
  const modalOpen = state.completed && !modalDismissed;

  const persist = useCallback(() => onPersist({ ...snapshot, elapsed: getSeconds() }), [snapshot, onPersist, getSeconds]);

  useEffect(() => {
    persist();
  }, [persist]);

  useEffect(() => {
    // 탭을 떠날 때 경과 시간을 URL 에 남긴다
    const onVisibility = () => {
      if (document.visibilityState === "hidden") persist();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", persist);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", persist);
    };
  }, [persist]);

  useEffect(() => {
    if (state.completed && !completedOnOpen) void celebrate();
  }, [state.completed, completedOnOpen]);

  useKeyboardControls(dispatch, pending === null && !modalOpen);

  const run = (action: PendingAction) => {
    if (action === "newGame") onNewGame(snapshot.mode, snapshot.difficulty);
    else if (action === "restart") onRestart(snapshot, state.solution);
    else onChangeSettings();
  };
  const request = (action: PendingAction) => {
    if (!state.completed && hasProgress(snapshot)) setPending(action);
    else run(action);
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-4">
      <header className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {MODE_LABEL[snapshot.mode]} · {DIFFICULTY_LABEL[snapshot.difficulty]}
        </span>
        <span className="font-mono tabular-nums">{formatElapsed(seconds)}</span>
        <span>힌트 {hintCount(snapshot)}회</span>
      </header>

      <Board snapshot={snapshot} board={board} selected={state.selected} onSelect={(cell) => dispatch({ type: "select", cell })} />

      <div className="grid grid-cols-5 gap-2">
        <button
          type="button"
          aria-pressed={state.inputMode === "note"}
          onClick={() => dispatch({ type: "toggleInputMode" })}
          className={`${BUTTON} aria-pressed:bg-sky-600 aria-pressed:text-white`}
        >
          메모
        </button>
        <button type="button" onClick={() => dispatch({ type: "erase" })} className={BUTTON}>
          지우기
        </button>
        <button type="button" disabled={state.completed || state.undo.length === 0} onClick={() => dispatch({ type: "undo" })} className={BUTTON}>
          되돌리기
        </button>
        <button type="button" disabled={state.completed || state.redo.length === 0} onClick={() => dispatch({ type: "redo" })} className={BUTTON}>
          다시하기
        </button>
        <button type="button" disabled={!canHint(state)} onClick={() => dispatch({ type: "hint" })} className={BUTTON}>
          힌트
        </button>
      </div>

      <NumberPad remaining={remainingCounts(board)} onInput={(digit) => dispatch({ type: "input", digit })} />

      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={() => request("newGame")} className={BUTTON}>새 게임</button>
        <button type="button" onClick={() => request("restart")} className={BUTTON}>다시 풀기</button>
        <button type="button" onClick={() => request("changeSettings")} className={BUTTON}>설정 변경</button>
      </div>

      {pending && (
        <Dialog title="확인">
          <p className="mb-4 text-sm">{CONFIRM_MESSAGE[pending]}</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setPending(null)} className={BUTTON}>취소</button>
            <button
              type="button"
              onClick={() => {
                setPending(null);
                run(pending);
              }}
              className="rounded-md bg-slate-900 px-2 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900"
            >
              확인
            </button>
          </div>
        </Dialog>
      )}

      {modalOpen && (
        <Dialog title="완성했습니다!">
          <dl className="mb-4 grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-slate-500 dark:text-slate-400">완료 시간</dt>
            <dd className="text-right font-mono tabular-nums">{formatElapsed(seconds)}</dd>
            <dt className="text-slate-500 dark:text-slate-400">힌트 사용</dt>
            <dd className="text-right">{hintCount(snapshot)}회</dd>
          </dl>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => run("restart")} className={BUTTON}>다시 풀기</button>
            <button type="button" onClick={() => run("newGame")} className={BUTTON}>새 게임</button>
            <button type="button" onClick={() => run("changeSettings")} className={BUTTON}>설정 변경</button>
            <button type="button" onClick={() => setModalDismissed(true)} className={BUTTON}>닫기</button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
