const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

interface Props {
  /** index 1~9 의 남은 개수 */
  remaining: number[];
  onInput: (digit: number) => void;
}

export function NumberPad({ remaining, onInput }: Props) {
  return (
    <div className="grid grid-cols-9 gap-1">
      {DIGITS.map((digit) => (
        <button
          key={digit}
          type="button"
          onClick={() => onInput(digit)}
          className={`flex flex-col items-center rounded-md bg-slate-100 py-2 dark:bg-slate-800 ${remaining[digit] === 0 ? "opacity-40" : ""}`}
        >
          <span className="text-xl font-medium">{digit}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{remaining[digit]}</span>
        </button>
      ))}
    </div>
  );
}
