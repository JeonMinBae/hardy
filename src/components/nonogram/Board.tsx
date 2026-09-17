"use client";

import { useRef, type Dispatch, type PointerEvent } from "react";
import { lineIndices, lineSatisfied, type Clues } from "@/lib/nonogram/clues";
import type { GameAction } from "@/lib/nonogram/game";
import { clueDepth, clueSlot } from "@/lib/nonogram/layout";
import { CROSSED, FILLED, type CellState } from "@/lib/nonogram/types";

// Tailwind 가 클래스를 찾을 수 있도록 전체 문자열로 둔다. 5칸마다와 바깥은 굵은 선
const RIGHT = { thin: "border-r border-r-slate-300 dark:border-r-slate-600", bold: "border-r-2 border-r-slate-500 dark:border-r-slate-400" };
const BOTTOM = { thin: "border-b border-b-slate-300 dark:border-b-slate-600", bold: "border-b-2 border-b-slate-500 dark:border-b-slate-400" };
const LEFT_EDGE = "border-l-2 border-l-slate-500 dark:border-l-slate-400";
const TOP_EDGE = "border-t-2 border-t-slate-500 dark:border-t-slate-400";
const CLUE = "text-slate-900 dark:text-slate-100";
// 단서 영역은 스크롤 때 위에 겹쳐 고정되므로 흐리게 할 때 opacity 대신 글자색을 바꾼다
const CLUE_DIM = "text-slate-400 dark:text-slate-500";
const WRONG = "shadow-[inset_0_0_0_2px_var(--color-rose-500)]";

interface Props {
  size: number;
  clues: Clues;
  cells: readonly CellState[];
  highlight: readonly number[];
  /** 칸 크기(px) */
  cell: number;
  zoomed: boolean;
  locked: boolean;
  dispatch: Dispatch<GameAction>;
}

export function Board({ size, clues, cells, highlight, cell, zoomed, locked, dispatch }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  // 판에 닿아 있는 포인터의 마지막 위치. 두 개 이상이면 획이 아니라 이동이다
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const strokePointer = useRef<number | null>(null);

  const rowDepth = clueDepth(clues.rows);
  const colDepth = clueDepth(clues.cols);
  const slot = clueSlot(cell);
  const wrong = new Set(highlight);
  const satisfied = lineIndices(size).map((indices, line) =>
    lineSatisfied(indices.map((i) => cells[i]), line < size ? clues.rows[line] : clues.cols[line - size]),
  );

  // 판 밖이면 음수이거나 size 이상인 좌표가 나온다
  const coordsAt = (x: number, y: number) => {
    const rect = gridRef.current!.getBoundingClientRect();
    return {
      row: Math.floor((y - rect.top - colDepth * slot) / cell),
      col: Math.floor((x - rect.left - rowDepth * slot) / cell),
    };
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size > 1) {
      // 두 번째 손가락이 닿으면 진행 중인 획은 없던 일로 하고 이동으로 바꾼다
      if (strokePointer.current !== null) dispatch({ type: "strokeCancel" });
      strokePointer.current = null;
      return;
    }
    if (locked) return;
    // coordsAt 은 grid 기준 좌표라, 스크롤바(target 이 scroller 자신)나 확대 상태에서 스크롤된 칸 위에
    // 겹쳐 고정된 단서 영역을 눌러도 그 밑의 칸을 가리킨다. 그래서 누른 요소로 먼저 걸러낸다
    const target = event.target as Element;
    if (target === event.currentTarget || target.closest("[data-clue]")) return;
    const { row, col } = coordsAt(event.clientX, event.clientY);
    if (row < 0 || col < 0 || row >= size || col >= size) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    strokePointer.current = event.pointerId;
    dispatch({ type: "strokeStart", cell: row * size + col });
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size > 1) {
      // 두 손가락 중점의 이동만큼 스크롤: 손가락마다 이동량의 절반씩 더한다
      if (zoomed) scrollerRef.current?.scrollBy((previous.x - event.clientX) / 2, (previous.y - event.clientY) / 2);
      return;
    }
    if (strokePointer.current === event.pointerId) dispatch({ type: "strokeMove", ...coordsAt(event.clientX, event.clientY) });
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (strokePointer.current !== event.pointerId) return;
    strokePointer.current = null;
    dispatch({ type: event.type === "pointercancel" ? "strokeCancel" : "strokeEnd" });
  };

  return (
    <div
      ref={scrollerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      // 터치 길게 누르기의 메뉴가 획을 끊지 않게 막는다
      onContextMenu={(event) => event.preventDefault()}
      // 높이 제한은 확대 상태에만 둔다. 맞춤 상태에서 판을 자르면 가려진 행을 볼 방법이 없다
      className={`max-w-full touch-none select-none ${zoomed ? "max-h-[100dvh] overflow-auto" : "overflow-hidden"}`}
    >
      <div
        ref={gridRef}
        aria-label="노노그램 판"
        className="grid w-max"
        style={{
          gridTemplateColumns: `${rowDepth * slot}px repeat(${size}, ${cell}px)`,
          gridTemplateRows: `${colDepth * slot}px repeat(${size}, ${cell}px)`,
          fontSize: `${Math.max(9, Math.round(cell * 0.5))}px`,
        }}
      >
        <div data-clue className="sticky top-0 left-0 z-20 bg-background" />
        {clues.cols.map((clue, col) => (
          <div key={`col${col}`} data-clue className={`sticky top-0 z-10 flex flex-col items-center justify-end bg-background ${satisfied[size + col] ? CLUE_DIM : CLUE}`}>
            {clue.map((n, i) => (
              <span key={i} className="flex items-end leading-none tabular-nums" style={{ height: slot }}>
                {n}
              </span>
            ))}
          </div>
        ))}
        {Array.from({ length: size }, (_, row) => [
          <div key={`row${row}`} data-clue className={`sticky left-0 z-10 flex items-center justify-end bg-background ${satisfied[row] ? CLUE_DIM : CLUE}`}>
            {clues.rows[row].map((n, i) => (
              <span key={i} className="text-center tabular-nums" style={{ width: slot }}>
                {n}
              </span>
            ))}
          </div>,
          ...Array.from({ length: size }, (_, col) => {
            const index = row * size + col;
            const state = cells[index];
            const edges = [
              col === 0 ? LEFT_EDGE : "",
              row === 0 ? TOP_EDGE : "",
              (col + 1) % 5 === 0 || col === size - 1 ? RIGHT.bold : RIGHT.thin,
              (row + 1) % 5 === 0 || row === size - 1 ? BOTTOM.bold : BOTTOM.thin,
            ].join(" ");
            return (
              <div
                key={index}
                className={`flex items-center justify-center ${edges} ${state === FILLED ? "bg-slate-800 dark:bg-slate-200" : "bg-white dark:bg-slate-900"} ${wrong.has(index) ? WRONG : ""}`}
              >
                {state === CROSSED && <span className="leading-none text-slate-400 dark:text-slate-500">✕</span>}
              </div>
            );
          }),
        ])}
      </div>
    </div>
  );
}
