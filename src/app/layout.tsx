import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "스도쿠",
  description: "초급·중급·고급, 일반·X 스도쿠. 진행 상황은 URL에 저장됩니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
