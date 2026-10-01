"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CUBE_SIZES, type CubeSize, type Move } from "@/lib/cube/cube";
import { cubePuzzleNumber } from "@/lib/cube/daily";
import { scramble as newScramble, dailyScramble } from "@/lib/cube/scramble";
import { EMPTY_DATA, finishDaily, finishPractice, updateBest, type DailyResult, type SavedData } from "@/lib/cube/saved";
import { buildDailySearch, buildPracticeSearch, parseCubeSearch } from "@/lib/cube/url";
import { loadSaved, storeSaved } from "./browserStorage";
import { GameScreen, type GameMode, type Progress } from "./GameScreen";
import { SelectScreen } from "./SelectScreen";

type Screen =
  | { name: "loading" }
  | { name: "select"; invalidLink: boolean; puzzle: number }
  | {
      name: "game";
      id: number;
      size: CubeSize;
      mode: GameMode;
      scramble: readonly Move[];
      history: readonly Move[];
      moveCount: number;
      elapsed: number;
      finished: DailyResult | null;
      showHelp: boolean;
    };

type HistoryMode = "push" | "replace";

/**
 * 오래 열어 둔 다른 탭의 기록을 덮어쓰지 않도록 저장된 값을 바탕으로 메모리 값을 합친다.
 * today 는 저장된 값 그대로라 호출부가 바뀐 크기만 갈아 끼우고, 결과는 이미 저장된 것이 우선이다
 */
function mergeWithStored(memory: SavedData): SavedData {
  const stored = loadSaved();
  const results = { ...memory.results };
  const best = { ...memory.best };
  for (const size of CUBE_SIZES) {
    results[size] = { ...memory.results[size], ...stored.results[size] };
    const [a, b] = [stored.best[size], memory.best[size]];
    best[size] = a && b ? updateBest(a, b) : (a ?? b);
  }
  return { today: stored.today, results, best, helpSeen: stored.helpSeen || memory.helpSeen };
}

export function CubeApp() {
  const search = useSearchParams().toString();
  const [saved, setSaved] = useState<SavedData | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "loading" });
  // 앱이 직접 쓴 search. useSearchParams 로 같은 값이 돌아오면 다시 해석하지 않는다
  const writtenSearch = useRef<string | null>(null);
  const gameId = useRef(0);
  const savedRef = useRef<SavedData>(EMPTY_DATA);

  useEffect(() => {
    const data = loadSaved();
    savedRef.current = data;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage(외부 시스템)는 마운트 뒤에만 읽을 수 있다
    setSaved(data);
  }, []);

  const commit = (next: SavedData) => {
    savedRef.current = next;
    setSaved(next);
    storeSaved(next);
  };

  const writeUrl = (next: string, history: HistoryMode) => {
    if (history === "replace" && next === writtenSearch.current) return;
    writtenSearch.current = next;
    const url = next ? `/cube?${next}` : "/cube";
    if (history === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  };

  const showSelect = (invalidLink: boolean) => setScreen({ name: "select", invalidLink, puzzle: cubePuzzleNumber(Date.now()) });

  const showGame = (game: Omit<Extract<Screen, { name: "game" }>, "name" | "id" | "showHelp">) => {
    gameId.current += 1;
    setScreen({ name: "game", id: gameId.current, showHelp: !savedRef.current.helpSeen, ...game });
  };

  const openDaily = (size: CubeSize) => {
    // 번호는 진입 시점에 고정한다. 자정을 넘겨도 진입한 번호로 끝까지 풀고 기록한다
    const puzzle = cubePuzzleNumber(Date.now());
    const data = mergeWithStored(savedRef.current);
    const progress = data.today[size]?.puzzle === puzzle ? data.today[size] : undefined;
    showGame({
      size,
      mode: { kind: "daily", puzzle },
      scramble: dailyScramble(puzzle, size),
      history: progress?.history ?? [],
      moveCount: progress?.moveCount ?? 0,
      elapsed: progress?.elapsed ?? 0,
      finished: data.results[size][puzzle] ?? null,
    });
  };

  const startPractice = (size: CubeSize, history: HistoryMode) => {
    const moves = newScramble(size, Math.random);
    // 섞기가 너무 길어 인코딩할 수 없으면 URL 없이 시작한다. 현재 설정에서는 일어나지 않는다
    writeUrl(buildPracticeSearch({ size, scramble: moves, history: [], moveCount: 0, elapsed: 0 }) ?? "", history);
    showGame({ size, mode: { kind: "practice" }, scramble: moves, history: [], moveCount: 0, elapsed: 0, finished: null });
  };

  const handleSearch = useEffectEvent(() => {
    writtenSearch.current = search;
    const route = parseCubeSearch(new URLSearchParams(search));
    if (route.kind === "select") showSelect(false);
    else if (route.kind === "invalid") {
      writeUrl("", "replace");
      showSelect(true);
    } else if (route.kind === "daily") openDaily(route.size);
    else if (route.kind === "newPractice") startPractice(route.size, "replace");
    else {
      const { size, scramble, history, moveCount, elapsed } = route.snapshot;
      showGame({ size, mode: { kind: "practice" }, scramble, history, moveCount, elapsed, finished: null });
    }
  });
  const ready = saved !== null;
  useEffect(() => {
    if (!ready || search === writtenSearch.current) return;
    handleSearch();
  }, [ready, search]);

  const persistDaily = (size: CubeSize, puzzle: number, progress: Progress) => {
    const data = mergeWithStored(savedRef.current);
    commit({ ...data, today: { ...data.today, [size]: { puzzle, ...progress } } });
  };

  const helpSeen = () => {
    if (!savedRef.current.helpSeen) commit({ ...mergeWithStored(savedRef.current), helpSeen: true });
  };

  const back = () => {
    writeUrl("", "push");
    showSelect(false);
  };

  if (!saved || screen.name === "loading") return null;
  if (screen.name === "select") {
    return (
      <SelectScreen
        invalidLink={screen.invalidLink}
        puzzle={screen.puzzle}
        saved={saved}
        showHelp={!saved.helpSeen}
        onHelpSeen={helpSeen}
        onDaily={(size) => {
          writeUrl(buildDailySearch(size), "push");
          openDaily(size);
        }}
        onPractice={(size) => startPractice(size, "push")}
      />
    );
  }

  const { size, mode } = screen;
  return (
    <GameScreen
      key={screen.id}
      size={size}
      mode={mode}
      scramble={screen.scramble}
      initialHistory={screen.history}
      initialMoveCount={screen.moveCount}
      initialElapsed={screen.elapsed}
      finished={screen.finished}
      results={saved.results[size]}
      best={saved.best[size]}
      showHelp={screen.showHelp}
      onProgress={(progress) => {
        if (mode.kind === "daily") persistDaily(size, mode.puzzle, progress);
        else {
          const search = buildPracticeSearch({ size, scramble: screen.scramble, ...progress });
          if (search !== null) writeUrl(search, "replace");
        }
      }}
      onFinish={(result) => {
        const data = mergeWithStored(savedRef.current);
        if (mode.kind === "daily") commit(finishDaily(data, size, mode.puzzle, result));
        else if (result !== "lost") commit(finishPractice(data, size, result));
      }}
      onHelpSeen={helpSeen}
      onNewScramble={() => startPractice(size, "push")}
      onBack={back}
    />
  );
}
