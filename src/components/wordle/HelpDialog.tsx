import { Dialog } from "@/components/common/Dialog";

const SOURCE_URL = "https://www.korean.go.kr/front/etcData/etcDataView.do?mn_id=208&etc_seq=71";
const KOGL_URL = "https://www.kogl.or.kr/info/license.do";
const LINK = "underline underline-offset-2";
const CHIP = "mr-2 inline-block rounded px-1.5 text-white";
const PRIMARY = "rounded-md bg-slate-900 px-2 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900";

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="워들 하는 법">
      <div className="flex flex-col gap-3 text-sm">
        <p>한국 시간 자정마다 새 단어가 나옵니다. 단어를 자모 7개로 풀어 8번 안에 맞혀 보세요.</p>
        <p>쌍자음, ㅐ·ㅘ 같은 모음 조합, 겹받침은 기본 자모로 풀어서 넣습니다.</p>
        <p className="font-mono">강아지 = ㄱㅏㅇㅇㅏㅈㅣ · 개구리 = ㄱㅏㅣㄱㅜㄹㅣ · 까닭 = ㄱㄱㅏㄷㅏㄹㄱ</p>
        <ul className="flex flex-col gap-1">
          <li>
            <span className={`${CHIP} bg-emerald-600`}>초록</span>자리까지 맞음
          </li>
          <li>
            <span className={`${CHIP} bg-amber-500`}>노랑</span>단어에 있지만 다른 자리
          </li>
          <li>
            <span className={`${CHIP} bg-slate-500 dark:bg-slate-700`}>회색</span>단어에 없음
          </li>
        </ul>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          단어 출처: 국립국어원{" "}
          <a href={SOURCE_URL} target="_blank" rel="noreferrer" className={LINK}>
            「한국어 학습용 어휘 목록」
          </a>{" "}
          (
          <a href={KOGL_URL} target="_blank" rel="noreferrer" className={LINK}>
            공공누리 제1유형
          </a>
          )
        </p>
        <button type="button" onClick={onClose} className={PRIMARY}>
          닫기
        </button>
      </div>
    </Dialog>
  );
}
