"use client";

import { useEffect, useRef, useState } from "react";

// 세로 스크롤바 폭(약 15~17px)보다 크게 잡는다
const GROW_THRESHOLD = 24;

/** 요소의 콘텐츠 폭(px). 첫 측정 전에는 null */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // observe 직후 한 번 콜백이 불린다
    // 조금 늘어난 폭은 무시한다. 폭 → 판 크기 → 페이지 스크롤바 생김/없어짐 → 폭이 번갈아 바뀌는 반복을 끊는다
    const observer = new ResizeObserver(([entry]) => {
      const next = entry.contentRect.width;
      setWidth((current) => (current === null || next < current || next - current >= GROW_THRESHOLD ? next : current));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
