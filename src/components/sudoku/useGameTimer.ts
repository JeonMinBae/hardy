"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_ELAPSED } from "@/lib/sudoku/codec";

const isVisible = () => typeof document === "undefined" || document.visibilityState === "visible";

export function useGameTimer(initialSeconds: number, active: boolean) {
  const accumulatedMs = useRef(initialSeconds * 1000);
  const startedAt = useRef<number | null>(null);
  const [visible, setVisible] = useState(isVisible);
  const [seconds, setSeconds] = useState(initialSeconds);
  const running = active && visible;

  const getSeconds = useCallback(() => {
    const runningMs = startedAt.current === null ? 0 : performance.now() - startedAt.current;
    return Math.min(MAX_ELAPSED, Math.floor((accumulatedMs.current + runningMs) / 1000));
  }, []);

  useEffect(() => {
    const onVisibility = () => setVisible(isVisible());
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!running) return;
    startedAt.current = performance.now();
    const id = window.setInterval(() => setSeconds(getSeconds()), 250);
    return () => {
      window.clearInterval(id);
      // 멈출 때 누적한다. 이 cleanup 은 같은 커밋의 새 effect(URL 쓰기)보다 먼저 실행된다
      accumulatedMs.current += performance.now() - (startedAt.current ?? performance.now());
      startedAt.current = null;
      setSeconds(getSeconds());
    };
  }, [running, getSeconds]);

  return { seconds, getSeconds };
}
