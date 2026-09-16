"use client";

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
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">스도쿠</h1>
      {invalidLink && (
        <p role="alert" className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
          잘못된 링크입니다. 새 게임을 선택해 주세요.
        </p>
      )}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">모드</h2>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className="rounded-lg border border-slate-300 px-3 py-3 aria-pressed:border-sky-600 aria-pressed:bg-sky-50 dark:border-slate-600 dark:aria-pressed:border-sky-400 dark:aria-pressed:bg-sky-950"
            >
              {MODE_LABEL[m]}
              {m === "x" && <span className="block text-xs text-slate-500 dark:text-slate-400">대각선 규칙 추가</span>}
            </button>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">난이도</h2>
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onStart(mode, d)}
            className="rounded-lg bg-slate-900 px-3 py-3 text-white dark:bg-slate-100 dark:text-slate-900"
          >
            {DIFFICULTY_LABEL[d]}
          </button>
        ))}
      </section>
    </main>
  );
}
