"use client";

import { useCallback, useEffect, useEffectEvent, useReducer, useRef, useState } from "react";
import { celebrate } from "@/components/common/celebrate";
import { Dialog } from "@/components/common/Dialog";
import { useGameTimer } from "@/components/common/useGameTimer";
import { formatElapsed } from "@/lib/common/time";
import { cluesOf } from "@/lib/nonogram/clues";
import { MAX_ELAPSED } from "@/lib/nonogram/codec";
import { createGame, gameReducer, hasProgress, wrongCells } from "@/lib/nonogram/game";
import { clueDepth, fitCellSize, MAX_CELL } from "@/lib/nonogram/layout";
import type { PuzzleInfo } from "@/lib/nonogram/puzzles";
import type { Mode, Size, Snapshot } from "@/lib/nonogram/types";
import { Board } from "./Board";
import { addCompleted } from "./completedStorage";
import { PuzzlePicture } from "./PuzzlePicture";
import { useElementWidth } from "./useElementWidth";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const BUTTON = `min-h-11 whitespace-nowrap rounded-md border border-line-strong px-1 py-2 text-sm disabled:opacity-40 ${FOCUS}`;
const PRIMARY = `min-h-11 rounded-md bg-accent px-2 py-2 text-sm text-surface active:scale-[0.99] ${FOCUS}`;
const MODE_BUTTON = `min-h-11 bg-sunken px-2 py-2 text-sm disabled:opacity-40 aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-surface ${FOCUS}`;
const MODE_LABEL: Record<Mode, string> = { fill: "■ 칠하기", cross: "✕ 표시" };
const NOTICE_MS = 2000;
// history API 호출 빈도 제한(Safari 는 30초에 100회)에 걸리지 않게 URL 쓰기 횟수를 제한한다.
// Next 가 쓰기마다 replaceState 를 한 번 더 부르므로 실제 호출은 두 배다
const URL_WRITE_WINDOW_MS = 30_000;
const URL_WRITES_PER_WINDOW = 40;

interface Props {
  puzzle: PuzzleInfo;
  initialSnapshot: Snapshot;
  onPersist: (puzzle: PuzzleInfo, snapshot: Snapshot) => void;
  onRestart: (puzzle: PuzzleInfo) => void;
  onList: (size: Size) => void;
}

export function GameScreen({ puzzle, initialSnapshot, onPersist, onRestart, onList }: Props) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createGame(puzzle.size, puzzle.solution, initialSnapshot));
  // 타이머 effect 가 URL 쓰기 effect 보다 먼저 선언돼야 완성 시점의 시간이 맞는다
  const { seconds, getSeconds } = useGameTimer(initialSnapshot.elapsed, !state.completed, MAX_ELAPSED);
  // 완성 URL 로 들어온 경우 폭죽과 완료 기록을 건너뛴다
  const [completedOnOpen] = useState(state.completed);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [clues] = useState(() => cluesOf(puzzle.solution, puzzle.size));
  const [boardRef, width] = useElementWidth<HTMLDivElement>();
  const { snapshot } = state;
  const stroking = state.stroke !== null;
  const modalOpen = state.completed && !modalDismissed;
  const fitCell = width === null ? null : fitCellSize(width, puzzle.size, clueDepth(clues.rows));

  const writeTimes = useRef<number[]>([]);
  const persist = useCallback(() => {
    const now = performance.now();
    writeTimes.current = [...writeTimes.current.filter((time) => now - time < URL_WRITE_WINDOW_MS), now];
    onPersist(puzzle, { ...snapshot, elapsed: getSeconds() });
  }, [puzzle, snapshot, onPersist, getSeconds]);

  useEffect(() => {
    // 끄는 도중에는 쓰지 않고 획이 끝나면 바로 쓴다(새로고침은 pagehide 전에 URL 을 정하므로 미루면 잃는다).
    // 한도에 닿았을 때만 가장 오래된 쓰기가 창을 벗어날 때까지 미룬다. 완성은 바로 쓴다
    if (stroking) return;
    const now = performance.now();
    const recent = writeTimes.current.filter((time) => now - time < URL_WRITE_WINDOW_MS);
    if (state.completed || recent.length < URL_WRITES_PER_WINDOW) {
      persist();
      return;
    }
    const id = window.setTimeout(persist, recent[0] + URL_WRITE_WINDOW_MS - now);
    return () => window.clearTimeout(id);
  }, [persist, stroking, state.completed]);

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
    if (!state.completed || completedOnOpen) return;
    addCompleted(puzzle.id);
    void celebrate();
  }, [state.completed, completedOnOpen, puzzle.id]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), NOTICE_MS);
    return () => window.clearTimeout(id);
  }, [notice]);

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (modalOpen || confirmRestart || !(event.ctrlKey || event.metaKey)) return;
    if (event.code === "KeyZ") {
      event.preventDefault();
      dispatch({ type: event.shiftKey ? "redo" : "undo" });
    } else if (event.code === "KeyY") {
      event.preventDefault();
      dispatch({ type: "redo" });
    }
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const requestHint = () => {
    if (wrongCells(snapshot.cells, puzzle.solution).length === 0) setNotice({ id: Date.now(), text: "틀린 칸이 없어요" });
    else dispatch({ type: "hint" });
  };
  // 화면을 떠나기 전에 미뤄 둔 URL 쓰기를 끝낸다. 떠난 뒤에 쓰면 새 기록 항목을 덮어쓴다
  const restart = () => {
    persist();
    onRestart(puzzle);
  };
  const openList = () => {
    persist();
    onList(puzzle.size);
  };
  const requestRestart = () => {
    if (!state.completed && hasProgress(snapshot)) setConfirmRestart(true);
    else restart();
  };

  return (
    <main data-game="nonogram" className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-4">
      <header className="flex items-center justify-between gap-2 border-b border-line pb-2 text-sm">
        <button type="button" onClick={openList} className="text-ink-muted hover:underline">
          ← 목록
        </button>
        <span className="truncate font-display text-lg font-semibold">
          {puzzle.size}×{puzzle.size} #{puzzle.number}
          {state.completed && ` ${puzzle.title}`}
        </span>
        <span className="font-numeral tabular-nums">{formatElapsed(seconds)}</span>
        <span className="text-sm text-ink-muted">힌트 {snapshot.hints}회</span>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 grid grid-cols-2 divide-x divide-line-strong overflow-hidden rounded-md border border-line-strong">
          {(["fill", "cross"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={state.mode === mode}
              disabled={state.completed}
              onClick={() => dispatch({ type: "setMode", mode })}
              className={MODE_BUTTON}
            >
              {MODE_LABEL[mode]}
            </button>
          ))}
        </div>
        <button type="button" disabled={!zoomed && fitCell === MAX_CELL} onClick={() => setZoomed(!zoomed)} className={BUTTON}>
          {zoomed ? "맞춤" : "확대"}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button type="button" disabled={state.completed || state.undo.length === 0} onClick={() => dispatch({ type: "undo" })} className={BUTTON}>
          되돌리기
        </button>
        <button type="button" disabled={state.completed || state.redo.length === 0} onClick={() => dispatch({ type: "redo" })} className={BUTTON}>
          다시하기
        </button>
        <button type="button" disabled={state.completed} onClick={requestHint} className={BUTTON}>
          힌트
        </button>
        <button type="button" onClick={requestRestart} className={BUTTON}>
          다시 풀기
        </button>
      </div>

      <p role="status" className="h-5 text-center text-sm text-ink-muted">
        {notice?.text}
      </p>

      <div ref={boardRef} className="w-full">
        {fitCell !== null && (
          <Board
            size={puzzle.size}
            clues={clues}
            cells={snapshot.cells}
            highlight={state.highlight}
            cell={zoomed ? MAX_CELL : fitCell}
            zoomed={zoomed}
            locked={state.completed}
            dispatch={dispatch}
          />
        )}
      </div>

      {confirmRestart && (
        <Dialog title="확인">
          <p className="mb-4 text-sm">칠한 칸과 힌트 사용 횟수, 시간이 초기화됩니다. 처음부터 다시 풀까요?</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setConfirmRestart(false)} className={BUTTON}>
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmRestart(false);
                restart();
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
          <div className="mb-4 flex flex-col items-center gap-2">
            <PuzzlePicture solution={puzzle.solution} size={puzzle.size} label={puzzle.title} className="w-32 text-ink" />
            <p className="font-display text-lg font-semibold">{puzzle.title}</p>
          </div>
          <dl className="mb-4 grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-ink-muted">완료 시간</dt>
            <dd className="text-right font-numeral tabular-nums">{formatElapsed(seconds)}</dd>
            <dt className="text-ink-muted">힌트 사용</dt>
            <dd className="text-right font-numeral tabular-nums">{snapshot.hints}회</dd>
          </dl>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={restart} className={BUTTON}>
              다시 풀기
            </button>
            <button type="button" onClick={openList} className={BUTTON}>
              목록
            </button>
            <button type="button" onClick={() => setModalDismissed(true)} className={BUTTON}>
              닫기
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
