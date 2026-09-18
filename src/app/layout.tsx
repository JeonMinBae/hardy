import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

// 제목용 세리프와 숫자용 산세리프. 본문 한글은 시스템 폰트를 그대로 쓴다
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });

export const metadata: Metadata = {
  // template 은 하위 세그먼트(/sudoku, /wordle)에만 붙고, 같은 세그먼트인 / 는 default 를 쓴다
  title: { default: "hardy", template: "%s · hardy" },
  description: "브라우저에서 즐기는 퍼즐 게임 모음",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`h-full antialiased ${fraunces.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
