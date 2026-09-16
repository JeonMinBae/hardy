import { completedUnitCells } from "@/lib/sudoku/board";
import { cellBackground, type CellBackground } from "@/lib/sudoku/display";
import type { Grid, Snapshot } from "@/lib/sudoku/types";

// Tailwind 가 클래스를 찾을 수 있도록 전체 문자열로 둔다
const BACKGROUND_CLASS: Record<CellBackground, string> = {
  selected: "bg-sky-300 dark:bg-sky-700",
  sameNumber: "bg-sky-200 dark:bg-sky-800",
  related: "bg-sky-50 dark:bg-slate-800",
  completed: "bg-emerald-100 dark:bg-emerald-950",
  diagonal: "bg-amber-50 dark:bg-amber-950/50",
  none: "bg-white dark:bg-slate-900",
};
const GIVEN_TEXT = "font-semibold text-slate-900 dark:text-slate-100";
const ENTRY_TEXT = "text-blue-600 dark:text-blue-400";
const HINT_TEXT = "text-fuchsia-600 dark:text-fuchsia-400";

interface Props {
  snapshot: Snapshot;
  board: Grid;
  selected: number | null;
  onSelect: (cell: number) => void;
}

export function Board({ snapshot, board, selected, onSelect }: Props) {
  const completed = completedUnitCells(board, snapshot.mode);
  return (
    <div aria-label="스도쿠 판" className="grid aspect-square w-full grid-cols-9 border-2 border-slate-800 dark:border-slate-300">
      {board.map((value, cell) => {
        const row = Math.floor(cell / 9);
        const col = cell % 9;
        const right = col === 8 ? "" : col % 3 === 2 ? "border-r-2 border-r-slate-800 dark:border-r-slate-300" : "border-r border-r-slate-300 dark:border-r-slate-600";
        const bottom = row === 8 ? "" : row % 3 === 2 ? "border-b-2 border-b-slate-800 dark:border-b-slate-300" : "border-b border-b-slate-300 dark:border-b-slate-600";
        const background = BACKGROUND_CLASS[cellBackground(cell, { board, mode: snapshot.mode, selected, completed })];
        const text = snapshot.givens[cell] ? GIVEN_TEXT : snapshot.hints[cell] ? HINT_TEXT : ENTRY_TEXT;
        return (
          <button
            key={cell}
            type="button"
            aria-label={`${row + 1}행 ${col + 1}열${value ? ` ${value}` : ""}`}
            onClick={() => onSelect(cell)}
            className={`relative flex items-center justify-center ${right} ${bottom} ${background}`}
          >
            {snapshot.notes[cell] !== 0 && <Notes mask={snapshot.notes[cell]} />}
            {value !== 0 && <span className={`relative text-xl sm:text-2xl ${text}`}>{value}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Notes({ mask }: { mask: number }) {
  return (
    <span aria-hidden className="absolute inset-0 grid grid-cols-3 grid-rows-3 text-[9px] leading-none text-slate-500 sm:text-[11px] dark:text-slate-400">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="flex items-center justify-center">
          {mask & (1 << i) ? i + 1 : ""}
        </span>
      ))}
    </span>
  );
}
