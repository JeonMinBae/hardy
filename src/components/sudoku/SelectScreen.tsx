"use client";

import Link from "next/link";
import { useState } from "react";
import { DIFFICULTY_LABEL, MODE_LABEL } from "@/lib/sudoku/display";
import { DIFFICULTIES, MODES, type Difficulty, type Mode } from "@/lib/sudoku/types";

interface Props {
  invalidLink: boolean;
  onStart: (mode: Mode, difficulty: Difficulty) => void;
}

export function SelectScreen({ invalidLink, onStart }: Props) {
  const [mode, setMode] = useState<Mode>("normal");
  return (
    <main data-game="sudoku" className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
      <Link href="/" className="-mb-4 text-sm text-ink-muted hover:underline">
        ← 홈
      </Link>
      <h1 className="font-display text-3xl font-semibold">스도쿠</h1>
      {invalidLink && (
        <p role="alert" className="rounded-md border border-near bg-near/20 px-3 py-2 text-sm">
          잘못된 링크입니다. 새 게임을 선택해 주세요.
        </p>
      )}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-ink-muted">모드</h2>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className="min-h-11 rounded-md border border-line-strong px-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:bg-accent-soft aria-pressed:outline-2 aria-pressed:-outline-offset-2 aria-pressed:outline-accent"
            >
              {MODE_LABEL[m]}
              {m === "x" && <span className="block text-xs text-ink-muted">대각선 규칙 추가</span>}
            </button>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-ink-muted">난이도</h2>
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onStart(mode, d)}
            className="min-h-11 rounded-md bg-accent px-3 py-3 text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99]"
          >
            {DIFFICULTY_LABEL[d]}
          </button>
        ))}
      </section>
    </main>
  );
}
