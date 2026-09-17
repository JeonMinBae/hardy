import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // template 은 하위 세그먼트(/sudoku, /wordle)에만 붙고, 같은 세그먼트인 / 는 default 를 쓴다
  title: { default: "hardy", template: "%s · hardy" },
  description: "브라우저에서 즐기는 퍼즐 게임 모음",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
