"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { emptySnapshot } from "@/lib/nonogram/game";
import type { PuzzleInfo } from "@/lib/nonogram/puzzles";
import type { Size, Snapshot } from "@/lib/nonogram/types";
import { buildGameSearch, buildListSearch, parseNonogramSearch } from "@/lib/nonogram/url";
import { GameScreen } from "./GameScreen";
import { ListScreen } from "./ListScreen";

type Screen =
  | { name: "loading" }
  | { name: "list"; size: Size; invalidLink: boolean }
  | { name: "game"; id: number; puzzle: PuzzleInfo; snapshot: Snapshot };

type HistoryMode = "push" | "replace";

export function NonogramApp() {
  const search = useSearchParams().toString();
  const [screen, setScreen] = useState<Screen>({ name: "loading" });
  // 앱이 직접 쓴 search. useSearchParams 로 같은 값이 돌아오면 다시 해석하지 않는다
  const writtenSearch = useRef<string | null>(null);
  const gameId = useRef(0);

  const writeUrl = useCallback((next: string, history: HistoryMode) => {
    if (history === "replace" && next === writtenSearch.current) return;
    writtenSearch.current = next;
    const url = next ? `/nonogram?${next}` : "/nonogram";
    try {
      if (history === "push") window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    } catch {
      // 호출 빈도 제한(Safari 의 SecurityError)에 걸려도 게임은 계속한다. 다음 변경 때 다시 쓴다
    }
  }, []);

  const showGame = useCallback((puzzle: PuzzleInfo, snapshot: Snapshot) => {
    gameId.current += 1;
    setScreen({ name: "game", id: gameId.current, puzzle, snapshot });
  }, []);

  /** 빈 판으로 시작한다. 목록에서 열기·다시 풀기는 push, s 없는 URL 진입은 replace */
  const startGame = useCallback(
    (puzzle: PuzzleInfo, history: HistoryMode) => {
      const snapshot = emptySnapshot(puzzle.size);
      writeUrl(buildGameSearch(puzzle, snapshot), history);
      showGame(puzzle, snapshot);
    },
    [showGame, writeUrl],
  );

  const showList = useCallback(
    (size: Size, history: HistoryMode) => {
      writeUrl(buildListSearch(size), history);
      setScreen({ name: "list", size, invalidLink: false });
    },
    [writeUrl],
  );

  useEffect(() => {
    if (search === writtenSearch.current) return;
    writtenSearch.current = search;
    const route = parseNonogramSearch(new URLSearchParams(search));
    if (route.kind === "list") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- URL(외부 시스템) 동기화
      setScreen({ name: "list", size: route.size, invalidLink: false });
    } else if (route.kind === "invalid") {
      writeUrl("", "replace");
      setScreen({ name: "list", size: 10, invalidLink: true });
    } else if (route.kind === "new") {
      startGame(route.puzzle, "replace");
    } else {
      showGame(route.puzzle, route.snapshot);
    }
  }, [search, showGame, startGame, writeUrl]);

  const persist = useCallback((puzzle: PuzzleInfo, snapshot: Snapshot) => writeUrl(buildGameSearch(puzzle, snapshot), "replace"), [writeUrl]);
  const openPuzzle = useCallback((puzzle: PuzzleInfo) => startGame(puzzle, "push"), [startGame]);
  const openList = useCallback((size: Size) => showList(size, "push"), [showList]);
  const changeTab = useCallback((size: Size) => showList(size, "replace"), [showList]);

  if (screen.name === "loading") return null;
  if (screen.name === "list") return <ListScreen size={screen.size} invalidLink={screen.invalidLink} onTab={changeTab} onOpen={openPuzzle} />;
  return <GameScreen key={screen.id} puzzle={screen.puzzle} initialSnapshot={screen.snapshot} onPersist={persist} onRestart={openPuzzle} onList={openList} />;
}
