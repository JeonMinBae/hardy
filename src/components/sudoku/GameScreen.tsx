"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { celebrate } from "@/components/common/celebrate";
import { Dialog } from "@/components/common/Dialog";
import { useCopyToClipboard } from "@/components/common/useCopyToClipboard";
import { useGameTimer } from "@/components/common/useGameTimer";
import { formatElapsed } from "@/lib/common/time";
import { boardValues, remainingCounts } from "@/lib/sudoku/board";
import { MAX_ELAPSED } from "@/lib/sudoku/codec";
import { DIFFICULTY_LABEL, MODE_LABEL } from "@/lib/sudoku/display";
import { canHint, createGame, gameReducer, hasProgress, hintCount } from "@/lib/sudoku/game";
import { shareText, shareUrl } from "@/lib/sudoku/share";
import type { Difficulty, Grid, Mode, Snapshot } from "@/lib/sudoku/types";
import { Board } from "./Board";
import { NumberPad } from "./NumberPad";
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

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const BUTTON = `min-h-11 rounded-md border border-line-strong px-2 py-2 text-sm disabled:opacity-40 ${FOCUS}`;
const PRIMARY = `min-h-11 rounded-md bg-accent px-2 py-2 text-sm text-surface active:scale-[0.99] ${FOCUS}`;

export function GameScreen({ initialSnapshot, solution, onPersist, onNewGame, onRestart, onChangeSettings }: Props) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createGame(initialSnapshot, solution));
  // 타이머 effect 가 URL 쓰기 effect 보다 먼저 선언돼야 완성 시점의 시간이 맞는다
  const { seconds, getSeconds } = useGameTimer(initialSnapshot.elapsed, !state.completed, MAX_ELAPSED);
  // 완성 URL 로 들어온 경우 폭죽을 터뜨리지 않는다
  const [completedOnOpen] = useState(state.completed);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const { copy, message: copyMessage } = useCopyToClipboard();
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
  // 아직 푸는 중이면 기록 줄 없이 문제 링크만 공유한다
  const share = () => void copy(shareText(snapshot, shareUrl(window.location.origin, snapshot), state.completed ? seconds : null));
  // 하단 버튼줄과 완성 다이얼로그 두 곳에 쓴다. 동시에 켜면 live region 이 두 번 읽히므로 아래에서 한쪽만 그린다
  const status = copyMessage && (
    <p role="status" className="text-center text-sm">
      {copyMessage}
    </p>
  );

  return (
    <main data-game="sudoku" className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-4">
      <header className="flex items-center justify-between border-b border-line pb-2">
        <span className="font-display text-lg font-semibold">
          {MODE_LABEL[snapshot.mode]} · {DIFFICULTY_LABEL[snapshot.difficulty]}
        </span>
        <span className="font-numeral tabular-nums">{formatElapsed(seconds)}</span>
        <span className="text-sm text-ink-muted">힌트 {hintCount(snapshot)}회</span>
      </header>

      <Board snapshot={snapshot} board={board} selected={state.selected} onSelect={(cell) => dispatch({ type: "select", cell })} />

      <div className="grid grid-cols-5 gap-2">
        <button
          type="button"
          aria-pressed={state.inputMode === "note"}
          onClick={() => dispatch({ type: "toggleInputMode" })}
          className={`${BUTTON} aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-surface`}
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

      <div className="grid grid-cols-4 gap-2">
        <button type="button" onClick={() => request("newGame")} className={BUTTON}>새 게임</button>
        <button type="button" onClick={() => request("restart")} className={BUTTON}>다시 풀기</button>
        <button type="button" onClick={() => request("changeSettings")} className={BUTTON}>설정 변경</button>
        <button type="button" onClick={share} className={BUTTON}>공유</button>
      </div>
      {!modalOpen && status}

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
              className={PRIMARY}
            >
              확인
            </button>
          </div>
        </Dialog>
      )}

      {modalOpen && (
        <Dialog title="완성했습니다!">
          <dl className="mb-4 grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-ink-muted">완료 시간</dt>
            <dd className="text-right font-numeral tabular-nums">{formatElapsed(seconds)}</dd>
            <dt className="text-ink-muted">힌트 사용</dt>
            <dd className="text-right font-numeral tabular-nums">{hintCount(snapshot)}회</dd>
          </dl>
          <div className="flex flex-col gap-2">
            {status}
            <button type="button" onClick={share} className={PRIMARY}>결과 공유</button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => run("restart")} className={BUTTON}>다시 풀기</button>
              <button type="button" onClick={() => run("newGame")} className={BUTTON}>새 게임</button>
              <button type="button" onClick={() => run("changeSettings")} className={BUTTON}>설정 변경</button>
              <button type="button" onClick={() => setModalDismissed(true)} className={BUTTON}>닫기</button>
            </div>
          </div>
        </Dialog>
      )}
    </main>
  );
}
