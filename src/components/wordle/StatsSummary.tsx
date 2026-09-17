import type { Stats } from "@/lib/wordle/stats";

interface Props {
  stats: Stats;
  /** 강조할 시도 수(오늘 성공한 횟수). 없으면 null */
  highlight: number | null;
}

export function StatsSummary({ stats, highlight }: Props) {
  const items = [
    ["플레이", stats.played],
    ["승률", `${stats.winRate}%`],
    ["현재 연속", stats.currentStreak],
    ["최장 연속", stats.maxStreak],
  ] as const;
  const max = Math.max(1, ...stats.distribution);
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-4 text-center">
        {items.map(([label, value]) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="text-xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <ol aria-label="시도 횟수 분포" className="flex flex-col gap-1 text-sm">
        {stats.distribution.map((count, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-3 tabular-nums">{i + 1}</span>
            <span
              style={{ width: `${(count / max) * 100}%` }}
              className={`min-w-6 rounded px-1.5 text-right text-white tabular-nums ${highlight === i + 1 ? "bg-emerald-600" : "bg-slate-500 dark:bg-slate-600"}`}
            >
              {count}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
