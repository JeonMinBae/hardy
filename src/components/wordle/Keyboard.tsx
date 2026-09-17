import type { Mark } from "@/lib/wordle/evaluate";
import { DELETE_KEY, ENTER_KEY, KEYBOARD_ROWS, type KeyboardKey } from "@/lib/wordle/keyboard";
import { MARK_CLASS } from "./Board";

const UNMARKED = "bg-slate-200 text-slate-900 dark:bg-slate-500 dark:text-white";
const LABEL: Record<string, string> = { [ENTER_KEY]: "입력", [DELETE_KEY]: "삭제" };

interface Props {
  marks: Map<string, Mark>;
  onKey: (key: KeyboardKey) => void;
}

export function Keyboard({ marks, onKey }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {KEYBOARD_ROWS.map((row, i) => (
        <div key={i} className="flex gap-1">
          {row.map((key) => {
            const mark = marks.get(key);
            const wide = key === ENTER_KEY || key === DELETE_KEY;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onKey(key)}
                className={`h-12 min-w-0 rounded-md font-semibold ${wide ? "flex-[1.5] text-sm" : "flex-1 text-lg"} ${mark ? MARK_CLASS[mark] : UNMARKED}`}
              >
                {LABEL[key] ?? key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
