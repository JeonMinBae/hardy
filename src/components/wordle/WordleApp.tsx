"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";
import { answerForPuzzle } from "@/lib/wordle/answers";
import { puzzleNumber } from "@/lib/wordle/daily";
import { keyMarks } from "@/lib/wordle/evaluate";
import { createGame, deleteJamo, statusOf, submitGuess, typeJamo, type SubmitError, type WordleState } from "@/lib/wordle/game";
import { DELETE_KEY, ENTER_KEY, jamoForKey, type KeyboardKey } from "@/lib/wordle/keyboard";
import { guessesFor } from "@/lib/wordle/saved";
import { recordResult, type Results } from "@/lib/wordle/stats";
import { Board } from "./Board";
import { loadSaved, storeSaved } from "./browserStorage";
import { Keyboard } from "./Keyboard";

const SUBMIT_ERROR_MESSAGE: Record<SubmitError, string> = {
  incomplete: "자모 6개를 모두 입력해 주세요",
  invalid: "글자가 되지 않는 조합이에요",
};
const NOTICE_MS = 2000;
const ICON_BUTTON = "flex h-9 w-9 items-center justify-center rounded-md text-lg hover:bg-slate-100 dark:hover:bg-slate-800";

interface Session {
  game: WordleState;
  results: Results;
  helpSeen: boolean;
}

const newGame = (puzzle: number, guesses: string[][] = []) => createGame(puzzle, answerForPuzzle(puzzle), guesses);

export function WordleApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);

  useEffect(() => {
    const saved = loadSaved();
    const puzzle = puzzleNumber(Date.now());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage(외부 시스템)는 마운트 뒤에만 읽을 수 있다
    setSession({ game: newGame(puzzle, guessesFor(saved, puzzle)), results: saved.results, helpSeen: saved.helpSeen });
  }, []);

  // 저장 대상만 의존한다. 입력 중인 줄(current)만 바뀌면 guesses 참조가 그대로라 다시 쓰지 않는다
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

  const updateGame = (change: (game: WordleState) => WordleState) => setSession((s) => s && { ...s, game: change(s.game) });

  const submit = () => {
    if (!session || statusOf(session.game) !== "playing") return;
    const { state, error } = submitGuess(session.game);
    if (error) {
      setNotice({ id: Date.now(), text: SUBMIT_ERROR_MESSAGE[error] });
      return;
    }
    const status = statusOf(state);
    const nextResults = status === "playing" ? session.results : recordResult(session.results, state.puzzle, status === "won" ? state.guesses.length : "lost");
    setSession({ ...session, game: state, results: nextResults });
  };

  const pressKey = (key: KeyboardKey) => {
    if (key === ENTER_KEY) submit();
    else if (key === DELETE_KEY) updateGame(deleteJamo);
    else updateGame((g) => typeJamo(g, [key]));
  };

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!session || event.ctrlKey || event.altKey || event.metaKey) return;
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

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-4">
      <header className="flex items-center justify-between">
        <Link href="/" aria-label="홈" className={ICON_BUTTON}>
          ←
        </Link>
        <h1 className="text-lg font-bold">워들 #{session.game.puzzle}</h1>
        <span className="w-9" />
      </header>

      <p role="status" className="h-5 text-center text-sm">
        {notice?.text}
      </p>

      <Board game={session.game} />
      <Keyboard marks={keyMarks(session.game.guesses, session.game.answer)} onKey={pressKey} />
    </main>
  );
}
