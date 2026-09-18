"use client";

import { completedUnitCells, conflictCells } from "@/lib/sudoku/board";
import { cellBackground, type CellBackground } from "@/lib/sudoku/display";
import type { Grid, Snapshot } from "@/lib/sudoku/types";

// Tailwind 가 클래스를 찾을 수 있도록 전체 문자열로 둔다
const BACKGROUND_CLASS: Record<CellBackground, string> = {
  selected: "bg-accent/30",
  sameNumber: "bg-accent/15",
  related: "bg-sunken",
  completed: "bg-ok/30",
  diagonal: "bg-near/20",
  none: "bg-surface",
};
const GIVEN_TEXT = "font-semibold text-ink";
const ENTRY_TEXT = "text-accent";
// 힌트로 채운 숫자는 입력과 같은 액센트색이라 점선 밑줄로 구분한다
const HINT_TEXT = "text-accent underline decoration-dotted decoration-1 underline-offset-2";
// 색만으로 알리지 않도록 물결 밑줄을 함께 준다
const CONFLICT_TEXT = "text-danger underline decoration-wavy decoration-1 underline-offset-2";

interface Props {
  snapshot: Snapshot;
  board: Grid;
  selected: number | null;
  onSelect: (cell: number) => void;
}

export function Board({ snapshot, board, selected, onSelect }: Props) {
  const completed = completedUnitCells(board, snapshot.mode);
  const conflicts = conflictCells(board, snapshot.mode);
  return (
    <div
      aria-label="스도쿠 판"
      className="grid aspect-square w-full grid-cols-9 overflow-hidden rounded-md border-2 border-ink-muted"
    >
      {board.map((value, cell) => {
        const row = Math.floor(cell / 9);
        const col = cell % 9;
        const right = col === 8 ? "" : col % 3 === 2 ? "border-r-2 border-r-ink-muted" : "border-r border-r-line-strong";
        const bottom = row === 8 ? "" : row % 3 === 2 ? "border-b-2 border-b-ink-muted" : "border-b border-b-line-strong";
        const background = BACKGROUND_CLASS[cellBackground(cell, { board, mode: snapshot.mode, selected, completed })];
        const given = snapshot.givens[cell] !== 0;
        const text = given ? GIVEN_TEXT : conflicts[cell] ? CONFLICT_TEXT : snapshot.hints[cell] ? HINT_TEXT : ENTRY_TEXT;
        // 처음 주어진 숫자는 반응하지 않는다. key 가 바뀌면 span 이 다시 마운트되며 애니메이션이 재생된다
        // (진행 중인 URL 로 들어오면 이미 놓인 숫자가 한 번 튄다)
        const animation = given ? "" : conflicts[cell] ? "animate-shake" : "animate-pop";
        return (
          <button
            key={cell}
            type="button"
            aria-label={`${row + 1}행 ${col + 1}열${value ? ` ${value}` : ""}`}
            onClick={() => onSelect(cell)}
            className={`relative flex items-center justify-center ${right} ${bottom} ${background} ${
              selected === cell ? "z-10 outline-2 -outline-offset-2 outline-accent" : ""
            } focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent`}
          >
            {snapshot.notes[cell] !== 0 && <Notes mask={snapshot.notes[cell]} withValue={value !== 0} />}
            {value !== 0 && (
              <span
                key={`${value}-${conflicts[cell]}`}
                className={`relative font-numeral text-xl tabular-nums sm:text-2xl ${snapshot.notes[cell] !== 0 ? "mt-2" : ""} ${text} ${animation}`}
              >
                {value}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Notes({ mask, withValue }: { mask: number; withValue: boolean }) {
  // 값과 함께 있으면 3×3 배치의 가운데(5)가 큰 숫자에 가려지므로 위쪽 한 줄로 모은다
  if (withValue) {
    const digits = Array.from({ length: 9 }, (_, i) => i + 1).filter((d) => mask & (1 << (d - 1)));
    return (
      <span aria-hidden className="absolute inset-x-0 top-0 break-all text-center font-numeral text-[7px] leading-none tracking-tighter text-ink-muted sm:text-[9px]">
        {digits.join("")}
      </span>
    );
  }
  return (
    <span aria-hidden className="absolute inset-0 grid grid-cols-3 grid-rows-3 font-numeral text-[9px] leading-none text-ink-muted sm:text-[11px]">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="flex items-center justify-center">
          {mask & (1 << i) ? i + 1 : ""}
        </span>
      ))}
    </span>
  );
}
