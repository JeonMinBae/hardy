import type { Metadata } from "next";
import { Suspense } from "react";
import { SudokuApp } from "@/components/sudoku/SudokuApp";

export const metadata: Metadata = {
  title: "스도쿠",
  description: "초급·중급·고급, 일반·X 스도쿠. 진행 상황은 URL에 저장됩니다.",
};

export default function SudokuPage() {
  return (
    <Suspense fallback={null}>
      <SudokuApp />
    </Suspense>
  );
}
