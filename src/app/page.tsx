import Link from "next/link";

const GAMES = [
  { href: "/sudoku", name: "스도쿠", description: "일반·X 스도쿠, 초급·중급·고급" },
  { href: "/wordle", name: "워들", description: "매일 한 문제, 자모 7개로 맞히는 한국어 단어" },
  { href: "/nonogram", name: "노노그램", description: "숫자 단서로 숨은 그림을 칠하는 퍼즐, 10×10·15×15·20×20" },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">hardy</h1>
      <ul className="flex flex-col gap-3">
        {GAMES.map((game) => (
          <li key={game.href}>
            <Link
              href={game.href}
              className="block rounded-lg border border-slate-300 px-4 py-4 hover:border-sky-600 hover:bg-sky-50 dark:border-slate-600 dark:hover:border-sky-400 dark:hover:bg-sky-950"
            >
              <span className="block text-lg font-semibold">{game.name}</span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">{game.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
