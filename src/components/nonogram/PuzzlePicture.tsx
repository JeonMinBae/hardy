interface Props {
  solution: readonly boolean[];
  size: number;
  label: string;
  className?: string;
}

/** 완성 그림. 칠한 칸마다 1×1 사각형 경로 하나로 그려 칸 수백 개의 요소를 만들지 않는다 */
export function PuzzlePicture({ solution, size, label, className }: Props) {
  const path = solution.flatMap((on, i) => (on ? [`M${i % size} ${Math.floor(i / size)}h1v1h-1z`] : [])).join("");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} shapeRendering="crispEdges" className={className}>
      <path d={path} fill="currentColor" />
    </svg>
  );
}
