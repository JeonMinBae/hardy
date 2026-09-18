"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CopyResult = "done" | "failed";

const COPY_MESSAGE: Record<CopyResult, string> = { done: "복사했어요", failed: "복사하지 못했어요" };
const CLEAR_DELAY_MS = 2000;

/** 클립보드에 복사하고 결과 문구를 잠시 보여준다. message 는 그대로 role="status" 에 넣으면 된다 */
export function useCopyToClipboard() {
  const [result, setResult] = useState<CopyResult | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(async (text: string) => {
    let next: CopyResult;
    try {
      // 비보안 컨텍스트에는 clipboard 가 없어 TypeError, 권한 거부는 reject 로 온다
      await navigator.clipboard.writeText(text);
      next = "done";
    } catch {
      next = "failed";
    }
    setResult(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setResult(null), CLEAR_DELAY_MS);
  }, []);

  return { copy, message: result === null ? null : COPY_MESSAGE[result] };
}
