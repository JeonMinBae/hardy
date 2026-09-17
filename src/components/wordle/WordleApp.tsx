"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";
import { celebrate } from "@/components/common/celebrate";
import { Dialog } from "@/components/common/Dialog";
import { answerForPuzzle } from "@/lib/wordle/answers";
import { puzzleNumber, secondsUntilNextPuzzle } from "@/lib/wordle/daily";
import { keyMarks } from "@/lib/wordle/evaluate";
import { createGame, deleteJamo, statusOf, submitGuess, typeJamo, type SubmitError, type WordleState } from "@/lib/wordle/game";
import { DELETE_KEY, ENTER_KEY, jamoForKey, type KeyboardKey } from "@/lib/wordle/keyboard";
import { guessesFor } from "@/lib/wordle/saved";
import { computeStats, recordResult, type Results } from "@/lib/wordle/stats";
import { Board } from "./Board";
import { loadSaved, storeSaved } from "./browserStorage";
import { HelpDialog } from "./HelpDialog";
import { Keyboard } from "./Keyboard";
import { ResultDialog } from "./ResultDialog";
import { StatsSummary } from "./StatsSummary";

const SUBMIT_ERROR_MESSAGE: Record<SubmitError, string> = {
  incomplete: "자모 6개를 모두 입력해 주세요",
  invalid: "글자가 되지 않는 조합이에요",
};
const NOTICE_MS = 2000;
const BUTTON = "rounded-md bg-slate-100 px-2 py-2 text-sm dark:bg-slate-800";
const ICON_BUTTON = "flex h-9 w-9 items-center justify-center rounded-md text-lg hover:bg-slate-100 dark:hover:bg-slate-800";

type Modal = "help" | "result" | "stats" | null;

interface Session {
  game: WordleState;
  results: Results;
  helpSeen: boolean;
  modal: Modal;
}

const newGame = (puzzle: number, guesses: string[][] = []) => createGame(puzzle, answerForPuzzle(puzzle), guesses);

export function WordleApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const saved = loadSaved();
    const puzzle = puzzleNumber(Date.now());
    const game = newGame(puzzle, guessesFor(saved, puzzle));
    // 끝난 오늘 문제로 다시 들어오면 결과 모달만 연다(폭죽 없음)
    const modal: Modal = !saved.helpSeen ? "help" : statusOf(game) === "playing" ? null : "result";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage(외부 시스템)는 마운트 뒤에만 읽을 수 있다
    setSession({ game, results: saved.results, helpSeen: saved.helpSeen, modal });
  }, []);

  // 저장 대상만 의존한다. 모달 여닫기와 입력 중인 줄(current)은 guesses 참조를 바꾸지 않아 쓰지 않는다
  const puzzle = session?.game.puzzle;
  const guesses = session?.game.guesses;
  const results = session?.results;
  const helpSeen = session?.helpSeen;
  useEffect(() => {
    if (puzzle === undefined || !guesses || !results || helpSeen === undefined) return;
    // 오래 열어 둔 다른 탭이 그사이 기록된 결과를 지우지 않도록 저장된 결과와 합친다
    storeSaved({ today: { puzzle, guesses }, results: { ...loadSaved().results, ...results }, helpSeen });
  }, [puzzle, guesses, results, helpSeen]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), NOTICE_MS);
    return () => window.clearTimeout(id);
  }, [notice]);

  const tick = useEffectEvent(() => {
    if (document.visibilityState !== "visible") return;
    const current = Date.now();
    setNow(current);
    const puzzle = puzzleNumber(current);
    // 자정이 지나면 끝내지 못한 문제는 버리고(플레이 수에 넣지 않음) 새 문제로 바꾼다
    setSession((s) => (s && s.game.puzzle !== puzzle ? { ...s, game: newGame(puzzle), modal: s.modal === "result" ? null : s.modal } : s));
  });
  useEffect(() => {
    // 끝난 문제로 재진입하면 결과 모달이 바로 열리므로 남은 시간을 첫 interval 전에 채운다
    const first = window.setTimeout(() => tick(), 0);
    const id = window.setInterval(() => tick(), 1000);
    const onVisibility = () => tick();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const updateGame = (change: (game: WordleState) => WordleState) =>
    setSession((s) => (s && s.modal === null ? { ...s, game: change(s.game) } : s));

  const submit = () => {
    if (!session || session.modal !== null || statusOf(session.game) !== "playing") return;
    const { state, error } = submitGuess(session.game);
    if (error) {
      setNotice({ id: Date.now(), text: SUBMIT_ERROR_MESSAGE[error] });
      return;
    }
    const status = statusOf(state);
    if (status === "playing") {
      setSession({ ...session, game: state });
      return;
    }
    const result = status === "won" ? state.guesses.length : "lost";
    setSession({ ...session, game: state, results: recordResult(session.results, state.puzzle, result), modal: "result" });
    if (status === "won") void celebrate();
  };

  const pressKey = (key: KeyboardKey) => {
    if (key === ENTER_KEY) submit();
    else if (key === DELETE_KEY) updateGame(deleteJamo);
    else updateGame((g) => typeJamo(g, [key]));
  };

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    // 모달이 열려 있으면 모달 버튼의 Enter 동작을 막지 않는다
    if (!session || session.modal !== null || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.key === "Enter") {
      // 포커스가 남은 화면 키 버튼이 Enter 로 한 번 더 눌리지 않게 막는다
      event.preventDefault();
      submit();
    } else if (event.key === "Backspace") {
      event.preventDefault();
      updateGame(deleteJamo);
    } else {
      const jamo = jamoForKey(event.code, event.shiftKey);
      if (jamo) updateGame((g) => typeJamo(g, jamo));
    }
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  if (!session) return null;
  const openModal = (modal: Modal) => setSession({ ...session, modal });
  const closeModal = () => setSession({ ...session, modal: null });
  const finished = statusOf(session.game) !== "playing";

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-4">
      <header className="flex items-center justify-between">
        <Link href="/" aria-label="홈" className={ICON_BUTTON}>
          ←
        </Link>
        <h1 className="text-lg font-bold">워들 #{session.game.puzzle}</h1>
        <div className="flex">
          <button type="button" aria-label="도움말" onClick={() => openModal("help")} className={ICON_BUTTON}>
            ?
          </button>
          <button type="button" aria-label="통계" onClick={() => openModal(finished ? "result" : "stats")} className={ICON_BUTTON}>
            📊
          </button>
        </div>
      </header>

      <p role="status" className="h-5 text-center text-sm">
        {notice?.text}
      </p>

      <Board game={session.game} />
      <Keyboard marks={keyMarks(session.game.guesses, session.game.answer)} onKey={pressKey} />

      {session.modal === "help" && <HelpDialog onClose={() => setSession({ ...session, helpSeen: true, modal: null })} />}
      {session.modal === "result" && (
        <ResultDialog game={session.game} results={session.results} secondsLeft={now === null ? null : secondsUntilNextPuzzle(now)} onClose={closeModal} />
      )}
      {session.modal === "stats" && (
        <Dialog title="통계">
          <StatsSummary stats={computeStats(session.results, session.game.puzzle)} highlight={null} />
          <button type="button" onClick={closeModal} className={`${BUTTON} mt-4 w-full`}>
            닫기
          </button>
        </Dialog>
      )}
    </main>
  );
}
