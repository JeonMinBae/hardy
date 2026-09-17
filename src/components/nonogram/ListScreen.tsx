"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listPuzzles, type PuzzleInfo } from "@/lib/nonogram/puzzles";
import { SIZES, type Size } from "@/lib/nonogram/types";
import { loadCompleted } from "./completedStorage";
import { PuzzlePicture } from "./PuzzlePicture";

interface Props {
  size: Size;
  invalidLink: boolean;
  onTab: (size: Size) => void;
  onOpen: (puzzle: PuzzleInfo) => void;
}

export function ListScreen({ size, invalidLink, onTab, onOpen }: Props) {
  const [completed, setCompleted] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage(외부 시스템)는 마운트 뒤에만 읽을 수 있다
    setCompleted(loadCompleted());
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="-mb-4 text-sm text-slate-500 hover:underline dark:text-slate-400">
        ← 홈
      </Link>
      <h1 className="text-3xl font-bold">노노그램</h1>
      {invalidLink && (
        <p role="alert" className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
          잘못된 링크입니다. 퍼즐을 다시 골라 주세요.
        </p>
      )}
      <div role="tablist" aria-label="판 크기" className="grid grid-cols-3 gap-2">
        {SIZES.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={s === size}
            onClick={() => onTab(s)}
            className="rounded-lg border border-slate-300 px-3 py-2 aria-selected:border-sky-600 aria-selected:bg-sky-50 dark:border-slate-600 dark:aria-selected:border-sky-400 dark:aria-selected:bg-sky-950"
          >
            {s}×{s}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {listPuzzles(size).map((puzzle) => {
          const done = completed.has(puzzle.id);
          return (
            <li key={puzzle.id}>
              <button
                type="button"
                onClick={() => onOpen(puzzle)}
                aria-label={done ? `${puzzle.number}번 ${puzzle.title}, 완료` : `${puzzle.number}번`}
                className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border border-slate-300 p-2 hover:border-sky-600 dark:border-slate-600 dark:hover:border-sky-400"
              >
                {done ? (
                  <>
                    <PuzzlePicture solution={puzzle.solution} size={puzzle.size} label={puzzle.title} className="min-h-0 w-full flex-1 text-slate-900 dark:text-slate-100" />
                    <span className="w-full truncate text-center text-xs">{puzzle.title}</span>
                  </>
                ) : (
                  <span className="text-2xl font-semibold tabular-nums">{puzzle.number}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
