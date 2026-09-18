import type { ReactNode } from "react";

export function Dialog({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-card"
      >
        <h2 className="mb-3 font-display text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
