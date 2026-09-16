"use client";

import { useEffect, type Dispatch } from "react";
import type { Direction, GameAction } from "@/lib/sudoku/game";

const ARROWS: Record<string, Direction> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };

export function useKeyboardControls(dispatch: Dispatch<GameAction>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // 한글 입력 상태면 event.key 가 'ㅜ' 등으로 바뀌므로 문자·숫자는 물리 키(code)로 판단한다
      if (event.ctrlKey || event.metaKey) {
        if (event.code === "KeyZ") {
          event.preventDefault();
          dispatch({ type: event.shiftKey ? "redo" : "undo" });
        } else if (event.code === "KeyY") {
          event.preventDefault();
          dispatch({ type: "redo" });
        }
        return;
      }
      if (event.altKey) return;
      const direction = ARROWS[event.key];
      const digit = /^(?:Digit|Numpad)([1-9])$/.exec(event.code);
      if (direction) {
        event.preventDefault();
        dispatch({ type: "move", direction });
      } else if (digit) {
        dispatch({ type: "input", digit: Number(digit[1]) });
      } else if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        dispatch({ type: "erase" });
      } else if (event.code === "KeyN") {
        dispatch({ type: "toggleInputMode" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, enabled]);
}
