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
          className={`flex min-h-11 flex-col items-center rounded-sm border border-line bg-sunken py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            remaining[digit] === 0 ? "opacity-40" : ""
          }`}
        >
          <span className="font-numeral text-xl font-medium tabular-nums">{digit}</span>
          <span className="font-numeral text-[10px] tabular-nums text-ink-muted">{remaining[digit]}</span>
        </button>
      ))}
    </div>
  );
}
