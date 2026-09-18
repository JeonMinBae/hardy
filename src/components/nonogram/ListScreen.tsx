"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listPuzzles, type PuzzleInfo } from "@/lib/nonogram/puzzles";
import { SIZES, type Size } from "@/lib/nonogram/types";
import { loadCompleted } from "./completedStorage";
import { PuzzlePicture } from "./PuzzlePicture";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

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
    <main data-game="nonogram" className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="-mb-4 text-sm text-ink-muted hover:underline">
        ← 홈
      </Link>
      <h1 className="font-display text-3xl font-semibold">노노그램</h1>
      {invalidLink && (
        <p role="alert" className="rounded-md border border-near bg-near/20 px-3 py-2 text-sm">
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
            className={`min-h-11 rounded-md border border-line-strong px-3 py-2 font-numeral tabular-nums aria-selected:bg-accent-soft aria-selected:outline-2 aria-selected:-outline-offset-2 aria-selected:outline-accent ${FOCUS}`}
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
                className={`flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border border-line-strong bg-surface p-2 hover:border-accent ${FOCUS}`}
              >
                {done ? (
                  <>
                    <PuzzlePicture solution={puzzle.solution} size={puzzle.size} label={puzzle.title} className="min-h-0 w-full flex-1 text-ink" />
                    <span className="w-full truncate text-center text-xs">{puzzle.title}</span>
                  </>
                ) : (
                  <span className="font-numeral text-2xl font-semibold tabular-nums text-ink-muted">{puzzle.number}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
