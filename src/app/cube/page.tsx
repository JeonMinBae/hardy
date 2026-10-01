import type { Metadata } from "next";
import { Suspense } from "react";
import { CubeApp } from "@/components/cube/CubeApp";

export const metadata: Metadata = {
  title: "큐브",
  description: "2×2·3×3 루빅스 큐브. 크기별 매일 한 문제와 무제한 연습",
};

export default function CubePage() {
  return (
    <Suspense fallback={null}>
      <CubeApp />
    </Suspense>
  );
}
