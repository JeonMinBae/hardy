import { Dialog } from "@/components/common/Dialog";

const PRIMARY =
  "min-h-11 rounded-md bg-accent px-2 py-2 text-sm text-surface active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="큐브 하는 법">
      <div className="flex flex-col gap-3 text-sm">
        <p>모든 면의 색이 하나로 통일되면 완성입니다. 2×2 와 3×3 중에서 고를 수 있어요.</p>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>큐브 조각을 누른 채 끌면 그 방향의 층이 90° 돌아갑니다. 3×3 은 가운데 층도 돌릴 수 있어요.</li>
          <li>큐브 바깥 빈 곳을 끌면 시점이 돌아갑니다. 이동 수에는 세지 않아요.</li>
          <li>R·L·U·D·F·B 버튼과 같은 이름의 키는 그 면을 시계 방향으로 돌립니다. ′ 버튼이나 Shift 를 함께 누르면 반시계 방향이에요.</li>
          <li>되돌리기 버튼과 Ctrl+Z(⌘+Z)는 직전 회전을 취소합니다. 되돌리기도 1수로 세요.</li>
          <li>첫 회전을 하면 타이머가 시작됩니다.</li>
          <li>포기하면 자동으로 맞춰 보여 줘요. 데일리는 실패로 기록됩니다.</li>
          <li>데일리는 크기별로 한국 시간 하루에 한 문제이고, 풀거나 포기하면 다시 풀 수 없어요.</li>
        </ul>
        <button type="button" onClick={onClose} className={PRIMARY}>
          닫기
        </button>
      </div>
    </Dialog>
  );
}
