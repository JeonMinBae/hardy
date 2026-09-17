import type { Metadata } from "next";
import { WordleApp } from "@/components/wordle/WordleApp";

export const metadata: Metadata = {
  title: "워들",
  description: "매일 한 문제, 자모 6개로 맞히는 한국어 단어 게임",
};

export default function WordlePage() {
  return <WordleApp />;
}
