import type { Metadata } from "next";
import { Suspense } from "react";
import { NonogramApp } from "@/components/nonogram/NonogramApp";

export const metadata: Metadata = {
  title: "노노그램",
  description: "숫자 단서로 숨은 그림을 칠하는 퍼즐. 진행 상황은 URL에 저장됩니다.",
};

export default function NonogramPage() {
  return (
    <Suspense fallback={null}>
      <NonogramApp />
    </Suspense>
  );
}
