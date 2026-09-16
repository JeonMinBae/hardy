import { Suspense } from "react";
import { SudokuApp } from "@/components/sudoku/SudokuApp";

export default function SudokuPage() {
  return (
    <Suspense fallback={null}>
      <SudokuApp />
    </Suspense>
  );
}
