"use client";

import { useState } from "react";
import type { CubeSize, Move } from "@/lib/cube/cube";
import { faceMove, NOTATION_FACES } from "@/lib/cube/notation";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const BUTTON = `min-h-11 rounded-md border border-line-strong px-2 py-2 text-sm disabled:opacity-40 ${FOCUS}`;
const KEY = `min-h-11 rounded-sm border border-line bg-sunken font-numeral text-lg tabular-nums active:scale-[0.97] disabled:opacity-40 ${FOCUS}`;

interface Props {
  size: CubeSize;
  disabled: boolean;
  canUndo: boolean;
  onMove: (move: Move) => void;
  onUndo: () => void;
  onGiveUp: () => void;
}

export function NotationPad({ size, disabled, canUndo, onMove, onUndo, onGiveUp }: Props) {
  const [prime, setPrime] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {NOTATION_FACES.map((face) => (
          <button key={face} type="button" disabled={disabled} onClick={() => onMove(faceMove(face, prime, size))} className={KEY}>
            {face}
            {prime ? "′" : ""}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={prime}
          aria-label="반시계 방향"
          disabled={disabled}
          onClick={() => setPrime((p) => !p)}
          className={`${KEY} aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-surface`}
        >
          ′
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={disabled || !canUndo} onClick={onUndo} className={BUTTON}>
          되돌리기
        </button>
        <button type="button" disabled={disabled} onClick={onGiveUp} className={BUTTON}>
          포기
        </button>
      </div>
    </div>
  );
}
