# hardy

Vercel에 배포하는 Next.js 퍼즐 게임 모음. `/`에서 게임을 고른다. 나머지 경로는 404다.

- `/sudoku` 스도쿠: 일반 / X(대각선), 초급·중급·고급(처음 주어진 칸 38~40 / 30~34 / 24~28). 게임 상태(퍼즐·입력·힌트·메모·경과 시간)는 URL 쿼리 `?m=&d=&s=`에만 저장된다
- `/wordle` 워들: 한국 시간 자정마다 바뀌는 단어를 기본 자모 6개로 풀어 6번 안에 맞힌다. 오늘 진행과 통계는 브라우저 localStorage(`hardy:wordle`)에 저장된다

## 명령

```bash
npm run dev        # 개발 서버 (http://localhost:3000)
npm test           # Vitest 단위 테스트 (src/lib)
npm run typecheck  # next typegen 후 tsc
npm run lint
npm run build
node scripts/build-wordle-answers.mts  # 워들 정답 목록 다시 만들기
```

## 구조

- `src/app`: `/`(홈), `/sudoku`, `/wordle` 페이지
- `src/lib/common`, `src/components/common`: 게임 공용 시간 표시·타이머·모달·폭죽
- `src/lib/sudoku`, `src/components/sudoku`: 스도쿠 규칙·풀이기·생성기·URL 코덱·리듀서와 화면
- `src/lib/wordle`: 자모 분해·조합, 정답 목록, 문제 번호, 판정, 입력 상태, 통계, 저장 형식 (순수 로직, 테스트 대상)
- `src/components/wordle`: 워들 화면과 localStorage 접근
- `scripts/build-wordle-answers.mts`, `scripts/data`: 워들 정답 목록 생성 스크립트와 원본. 출처는 `src/lib/wordle/answers-source.md`
