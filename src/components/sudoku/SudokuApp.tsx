"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSnapshot, restartSnapshot } from "@/lib/sudoku/game";
import { generatePuzzle } from "@/lib/sudoku/generator";
import type { Difficulty, Grid, Mode, Snapshot } from "@/lib/sudoku/types";
import { buildGameSearch, parseGameSearch } from "@/lib/sudoku/url";
import { GameScreen } from "./GameScreen";
import { SelectScreen } from "./SelectScreen";

type Screen =
  | { name: "loading" }
  | { name: "select"; invalidLink: boolean }
  | { name: "game"; id: number; snapshot: Snapshot; solution: Grid };

type HistoryMode = "push" | "replace";

export function SudokuApp() {
  const search = useSearchParams().toString();
  const [screen, setScreen] = useState<Screen>({ name: "loading" });
  const [generating, setGenerating] = useState(false);
  // 앱이 직접 쓴 search. useSearchParams 로 같은 값이 돌아오면 다시 해석하지 않는다
  const writtenSearch = useRef<string | null>(null);
  const gameId = useRef(0);

  const writeUrl = useCallback((next: string, history: HistoryMode) => {
    if (history === "replace" && next === writtenSearch.current) return;
    writtenSearch.current = next;
    const url = next ? `/sudoku?${next}` : "/sudoku";
    if (history === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  }, []);

  const showGame = useCallback((snapshot: Snapshot, solution: Grid) => {
    gameId.current += 1;
    setScreen({ name: "game", id: gameId.current, snapshot, solution });
  }, []);

  const startNewGame = useCallback(
    (mode: Mode, difficulty: Difficulty, history: HistoryMode) => {
      setGenerating(true);
      // 생성이 메인 스레드를 막으므로 '생성 중' 표시가 먼저 그려지도록 한 프레임 미룬다
      requestAnimationFrame(() =>
        setTimeout(() => {
          const { givens, solution } = generatePuzzle(mode, difficulty);
          const snapshot = createSnapshot(mode, difficulty, givens);
          writeUrl(buildGameSearch(snapshot), history);
          setGenerating(false);
          showGame(snapshot, solution);
        }, 0),
      );
    },
    [showGame, writeUrl],
  );

  useEffect(() => {
    if (search === writtenSearch.current) return;
    writtenSearch.current = search;
    const parsed = parseGameSearch(new URLSearchParams(search));
    if (parsed.kind === "select") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- URL(외부 시스템) 동기화
      setScreen({ name: "select", invalidLink: false });
    } else if (parsed.kind === "invalid") {
      writeUrl("", "replace");
      setScreen({ name: "select", invalidLink: true });
    } else if (parsed.kind === "new") {
      startNewGame(parsed.mode, parsed.difficulty, "replace");
    } else {
      showGame(parsed.snapshot, parsed.solution);
    }
  }, [search, showGame, startNewGame, writeUrl]);

  const persist = useCallback((snapshot: Snapshot) => writeUrl(buildGameSearch(snapshot), "replace"), [writeUrl]);
  const newGame = useCallback((mode: Mode, difficulty: Difficulty) => startNewGame(mode, difficulty, "push"), [startNewGame]);
  const restart = useCallback(
    (snapshot: Snapshot, solution: Grid) => {
      const next = restartSnapshot(snapshot);
      writeUrl(buildGameSearch(next), "push");
      showGame(next, solution);
    },
    [showGame, writeUrl],
  );
  const changeSettings = useCallback(() => {
    writeUrl("", "push");
    setScreen({ name: "select", invalidLink: false });
  }, [writeUrl]);
  const start = useCallback((mode: Mode, difficulty: Difficulty) => startNewGame(mode, difficulty, "replace"), [startNewGame]);

  if (generating) {
    return <p className="mx-auto py-20 text-center text-lg">퍼즐을 만드는 중…</p>;
  }
  if (screen.name === "loading") return null;
  if (screen.name === "select") return <SelectScreen invalidLink={screen.invalidLink} onStart={start} />;
  return (
    <GameScreen
      key={screen.id}
      initialSnapshot={screen.snapshot}
      solution={screen.solution}
      onPersist={persist}
      onNewGame={newGame}
      onRestart={restart}
      onChangeSettings={changeSettings}
    />
  );
}
