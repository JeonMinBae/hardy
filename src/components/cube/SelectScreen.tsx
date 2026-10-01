"use client";

import Link from "next/link";
import { useState } from "react";
import { formatElapsed } from "@/lib/common/time";
import { CUBE_SIZES, type CubeSize } from "@/lib/cube/cube";
import type { SavedData } from "@/lib/cube/saved";
import { HelpDialog } from "./HelpDialog";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const ICON_BUTTON = `flex h-9 w-9 items-center justify-center rounded-md text-lg hover:bg-sunken ${FOCUS}`;
const PRIMARY = `min-h-11 rounded-md bg-accent px-3 py-3 text-surface active:scale-[0.99] ${FOCUS}`;
const QUIET = `min-h-11 rounded-md border border-line-strong px-3 py-3 ${FOCUS}`;

interface Props {
  invalidLink: boolean;
  /** 오늘의 문제 번호 */
  puzzle: number;
  saved: SavedData;
  showHelp: boolean;
  onHelpSeen: () => void;
  onDaily: (size: CubeSize) => void;
  onPractice: (size: CubeSize) => void;
}

function dailyState(saved: SavedData, size: CubeSize, puzzle: number): string {
  const result = saved.results[size][puzzle];
  if (result === "lost") return "완료 · 포기";
  if (result) return `완료 · ${formatElapsed(result.seconds)} · ${result.moves}수`;
  return saved.today[size]?.puzzle === puzzle ? "진행 중" : "아직 안 함";
}

export function SelectScreen({ invalidLink, puzzle, saved, showHelp, onHelpSeen, onDaily, onPractice }: Props) {
  const [size, setSize] = useState<CubeSize>(3);
  const [helpOpen, setHelpOpen] = useState(showHelp);
  return (
    <main data-game="cube" className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-4">
      <header className="flex items-center justify-between border-b border-line pb-2">
        <Link href="/" aria-label="홈" className={ICON_BUTTON}>
          ←
        </Link>
        <h1 className="font-display text-lg font-semibold">큐브</h1>
        <button type="button" aria-label="도움말" onClick={() => setHelpOpen(true)} className={ICON_BUTTON}>
          ?
        </button>
      </header>
      {invalidLink && (
        <p role="alert" className="rounded-md border border-near bg-near/20 px-3 py-2 text-sm">
          링크가 올바르지 않아요
        </p>
      )}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-ink-muted">크기</h2>
        <div className="grid grid-cols-2 gap-2">
          {CUBE_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={size === s}
              onClick={() => setSize(s)}
              className={`${QUIET} aria-pressed:bg-accent-soft aria-pressed:outline-2 aria-pressed:-outline-offset-2 aria-pressed:outline-accent`}
            >
              {s}×{s}
            </button>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-ink-muted">모드</h2>
        <button type="button" onClick={() => onDaily(size)} className={PRIMARY}>
          오늘의 문제
          <span className="block text-xs opacity-80">
            #{puzzle} · {dailyState(saved, size, puzzle)}
          </span>
        </button>
        <button type="button" onClick={() => onPractice(size)} className={QUIET}>
          연습
        </button>
      </section>
      {helpOpen && (
        <HelpDialog
          onClose={() => {
            setHelpOpen(false);
            onHelpSeen();
          }}
        />
      )}
    </main>
  );
}
