"use client";

import dynamic from "next/dynamic";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { celebrate } from "@/components/common/celebrate";
import { Dialog } from "@/components/common/Dialog";
import { useCopyToClipboard } from "@/components/common/useCopyToClipboard";
import { useGameTimer } from "@/components/common/useGameTimer";
import { formatElapsed } from "@/lib/common/time";
import { MAX_ELAPSED } from "@/lib/cube/codec";
import type { CubeSize, Move } from "@/lib/cube/cube";
import { createGame, giveUp, solutionMoves, turn, undo, undoMove, type CubeGame } from "@/lib/cube/game";
import { keyToMove } from "@/lib/cube/notation";
import type { DailyResult, SolveRecord } from "@/lib/cube/saved";
import { practiceShareUrl } from "@/lib/cube/share";
import type { CubeViewHandle } from "./CubeView";
import { HelpDialog } from "./HelpDialog";
import { NotationPad } from "./NotationPad";
import { ResultDialog } from "./ResultDialog";

// three.js 는 이 화면에서만 불러온다. next/dynamic 의 ssr:false 는 클라이언트 컴포넌트에서만 쓸 수 있다
const CubeView = dynamic(() => import("./CubeView"), { ssr: false });

export type GameMode = { kind: "daily"; puzzle: number } | { kind: "practice" };

export interface Progress {
  history: Move[];
  moveCount: number;
  elapsed: number;
}

interface Props {
  size: CubeSize;
  mode: GameMode;
  scramble: readonly Move[];
  initialHistory: readonly Move[];
  initialMoveCount: number;
  initialElapsed: number;
  /** 열 때 이미 끝나 있는 데일리의 결과 */
  finished: DailyResult | null;
  /** 이 크기의 데일리 결과 전체 */
  results: Record<number, DailyResult>;
  best: SolveRecord | null;
  showHelp: boolean;
  onProgress: (progress: Progress) => void;
  /** 연습은 성공했을 때만 부른다 */
  onFinish: (result: DailyResult) => void;
  onHelpSeen: () => void;
  onNewScramble: () => void;
  onBack: () => void;
}

type Modal = "help" | "result" | "giveUp" | "reshuffle" | null;

const FULL_MOTION = { turn: 180, solve: 220, spin: 1600 };
const REDUCED_MOTION = { turn: 40, solve: 40, spin: 0 };
// 지연 로딩 중인 뷰를 기다리는 간격과 횟수(합쳐 5초)
const VIEW_POLL_MS = 50;
const VIEW_POLL_MAX = 100;

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const BUTTON = `min-h-11 rounded-md border border-line-strong px-2 py-2 text-sm disabled:opacity-40 ${FOCUS}`;
const PRIMARY = `min-h-11 rounded-md bg-accent px-2 py-2 text-sm text-surface active:scale-[0.99] ${FOCUS}`;
const ICON_BUTTON = `flex h-9 w-9 items-center justify-center rounded-md text-lg hover:bg-sunken ${FOCUS}`;

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

function openState(props: Props) {
  const { size, scramble, initialHistory, initialMoveCount, initialElapsed, finished } = props;
  if (finished === null) {
    const game = createGame(size, scramble, initialHistory, initialMoveCount);
    const opened = game.status === "solved";
    const result: DailyResult | null = opened ? { seconds: initialElapsed, moves: initialMoveCount } : null;
    return { game, initialMoves: [...scramble, ...initialHistory], opened, result, elapsed: initialElapsed };
  }
  // 이미 끝난 데일리는 섞기 + 자동 풀이로 맞춰진 큐브를 보여 준다
  const solution = solutionMoves(createGame(size, scramble));
  const solved = createGame(size, scramble, solution, finished === "lost" ? solution.length : finished.moves);
  const game: CubeGame = finished === "lost" ? { ...solved, status: "gaveUp" } : solved;
  return { game, initialMoves: [...scramble, ...solution], opened: true, result: finished, elapsed: finished === "lost" ? 0 : finished.seconds };
}

export function GameScreen(props: Props) {
  const { size, mode, scramble, results, best, showHelp, onProgress, onFinish, onHelpSeen, onNewScramble, onBack } = props;
  const [init] = useState(() => openState(props));
  const [game, setGame] = useState(init.game);
  const [modal, setModal] = useState<Modal>(init.opened ? "result" : showHelp ? "help" : null);
  const [result, setResult] = useState<DailyResult | null>(init.result);
  const [motion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? REDUCED_MOTION : FULL_MOTION,
  );
  const { copy, message: copyMessage } = useCopyToClipboard();

  // 타이머 effect 가 진행 저장 effect 보다 먼저 선언돼야 저장 시점의 시간이 맞는다
  const { seconds, getSeconds } = useGameTimer(init.elapsed, game.moveCount > 0 && game.status === "playing", MAX_ELAPSED);

  const view = useRef<CubeViewHandle>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const locked = useRef(init.opened);
  // 언마운트 뒤에는 큐에 남은 단계가 state 나 저장을 건드리지 않게 한다
  const cancelled = useRef(false);
  // 큐 안의 비동기 단계는 렌더 시점 state 가 아니라 최신 게임을 봐야 한다
  const gameRef = useRef(game);

  const apply = (next: CubeGame) => {
    gameRef.current = next;
    setGame(next);
  };
  const enqueue = (step: () => Promise<void>) => {
    queue.current = queue.current.then(() => (cancelled.current ? undefined : step())).catch(() => {});
  };
  // 뷰는 지연 로딩이라 첫 입력이 로딩보다 빠를 수 있다. 없는 채로 상태만 바꾸면 화면과 어긋난다
  const readyView = async () => {
    for (let i = 0; i < VIEW_POLL_MAX && !view.current && !cancelled.current; i++) await new Promise((resolve) => setTimeout(resolve, VIEW_POLL_MS));
    return cancelled.current ? null : view.current;
  };

  // 완성은 회전이라는 행동에서만 연출한다. 이미 끝난 채 열린 경우(init.opened)는 대화상자만 연다
  const complete = async (next: CubeGame) => {
    locked.current = true;
    const record = { seconds: getSeconds(), moves: next.moveCount };
    setResult(record);
    onFinish(record);
    void celebrate();
    await (await readyView())?.spin(motion.spin);
    if (cancelled.current) return;
    setModal("result");
  };

  const step = async (move: Move, next: (game: CubeGame) => CubeGame) => {
    await (await readyView())?.turn(move, motion.turn);
    if (cancelled.current) return;
    const after = next(gameRef.current);
    apply(after);
    if (after.status === "solved") await complete(after);
  };

  const requestTurn = (move: Move) =>
    enqueue(async () => {
      if (locked.current || gameRef.current.status !== "playing") return;
      await step(move, (g) => turn(g, move));
    });

  const requestUndo = () =>
    enqueue(async () => {
      const move = undoMove(gameRef.current);
      if (locked.current || !move || gameRef.current.status !== "playing") return;
      await step(move, undo);
    });

  const runGiveUp = () =>
    enqueue(async () => {
      const current = gameRef.current;
      if (locked.current || current.status !== "playing") return;
      locked.current = true;
      const moves = solutionMoves(current);
      apply(giveUp(current));
      setResult("lost");
      // 재생 중 새로고침해도 실패가 남도록 재생 전에 기록한다. 연습은 기록하지 않는다
      if (mode.kind === "daily") onFinish("lost");
      for (const move of moves) {
        if (cancelled.current) return;
        await (await readyView())?.turn(move, motion.solve);
      }
      if (cancelled.current) return;
      setModal("result");
    });

  const requestReshuffle = () => (game.moveCount > 0 && game.status === "playing" ? setModal("reshuffle") : onNewScramble());

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (modal !== null || locked.current || game.status !== "playing" || isTyping(event.target)) return;
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.code === "KeyZ") {
      event.preventDefault();
      requestUndo();
      return;
    }
    if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
    const move = keyToMove(event.code, event.shiftKey, size);
    if (!move) return;
    event.preventDefault();
    requestTurn(move);
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const emitProgress = useEffectEvent(() => {
    // 끝난 데일리의 진행은 finishDaily 가 지웠으므로 다시 쓰지 않는다
    if (init.opened || game.moveCount === 0 || (mode.kind === "daily" && game.status !== "playing")) return;
    onProgress({ history: [...game.history], moveCount: game.moveCount, elapsed: getSeconds() });
  });
  useEffect(() => {
    emitProgress();
  }, [game.history, game.moveCount]);
  const emitOnLeave = useEffectEvent(() => {
    if (mode.kind === "daily") emitProgress();
  });
  useEffect(() => {
    // StrictMode 의 모의 언마운트 뒤에도 다시 살아나야 한다
    cancelled.current = false;
    return () => {
      cancelled.current = true;
      // 뒤로 가기·언마운트로 화면을 떠나도 데일리 경과 시간이 남게 마지막 진행을 저장한다.
      // 연습은 URL 을 쓰는데, 이 시점엔 이미 선택 화면 URL 로 바뀌어 있어 덮어쓰면 안 된다
      emitOnLeave();
    };
  }, []);
  useEffect(() => {
    // 탭을 떠날 때 경과 시간을 남긴다
    const onVisibility = () => {
      if (document.visibilityState === "hidden") emitProgress();
    };
    const onPageHide = () => emitProgress();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  const playing = game.status === "playing";
  const closeHelp = () => {
    setModal(null);
    onHelpSeen();
  };

  return (
    <main data-game="cube" className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-4">
      <header className="flex items-center justify-between gap-2 border-b border-line pb-2">
        <button type="button" aria-label="뒤로" onClick={onBack} className={ICON_BUTTON}>
          ←
        </button>
        <h1 className="font-display text-lg font-semibold">
          큐브 {size}×{size} · {mode.kind === "daily" ? `데일리 #${mode.puzzle}` : "연습"}
        </h1>
        <button type="button" aria-label="도움말" onClick={() => setModal("help")} className={ICON_BUTTON}>
          ?
        </button>
      </header>
      <div className="flex items-baseline justify-between px-1">
        <span className="font-numeral tabular-nums">{formatElapsed(seconds)}</span>
        <span className="text-sm text-ink-muted">{game.moveCount}수</span>
      </div>

      <div className="aspect-square w-full">
        <CubeView ref={view} size={size} initialMoves={init.initialMoves} interactive={playing && modal === null} onDragMove={requestTurn} />
      </div>

      <NotationPad
        size={size}
        disabled={!playing}
        canUndo={game.history.length > 0}
        onMove={requestTurn}
        onUndo={requestUndo}
        onGiveUp={() => setModal("giveUp")}
      />

      {(mode.kind === "practice" || (!playing && result !== null && modal === null)) && (
        <div className="grid grid-cols-2 gap-2">
          {mode.kind === "practice" && (
            <>
              <button type="button" onClick={requestReshuffle} className={BUTTON}>
                새로 섞기
              </button>
              <button type="button" onClick={() => void copy(practiceShareUrl(window.location.origin, size, scramble))} className={BUTTON}>
                링크 복사
              </button>
            </>
          )}
          {!playing && result !== null && modal === null && (
            <button type="button" onClick={() => setModal("result")} className={BUTTON}>
              결과 보기
            </button>
          )}
        </div>
      )}
      {modal !== "result" && copyMessage && (
        <p role="status" className="text-center text-sm">
          {copyMessage}
        </p>
      )}

      {modal === "help" && <HelpDialog onClose={closeHelp} />}
      {modal === "giveUp" && (
        <Dialog title="포기할까요?">
          <p className="mb-4 text-sm">포기하면 자동으로 맞춰 보여 줘요. 데일리는 실패로 기록돼요.</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setModal(null)} className={BUTTON}>
              계속
            </button>
            <button
              type="button"
              onClick={() => {
                setModal(null);
                runGiveUp();
              }}
              className={PRIMARY}
            >
              포기
            </button>
          </div>
        </Dialog>
      )}
      {modal === "reshuffle" && (
        <Dialog title="새로 섞을까요?">
          <p className="mb-4 text-sm">풀던 내용이 사라져요.</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setModal(null)} className={BUTTON}>
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                setModal(null);
                onNewScramble();
              }}
              className={PRIMARY}
            >
              새로 섞기
            </button>
          </div>
        </Dialog>
      )}
      {modal === "result" && result !== null && (
        <ResultDialog
          size={size}
          puzzle={mode.kind === "daily" ? mode.puzzle : null}
          scramble={scramble}
          result={result}
          results={results}
          best={best}
          onNewScramble={onNewScramble}
          onClose={() => setModal(null)}
        />
      )}
    </main>
  );
}
