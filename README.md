# 스도쿠

Vercel에 배포하는 Next.js 스도쿠 앱. `/sudoku`에서만 동작하고 나머지 경로는 404다.

- 모드: 일반 / X(대각선), 난이도: 초급·중급·고급(처음 주어진 칸 38~40 / 30~34 / 24~28)
- 게임 상태(퍼즐·입력·힌트·메모·경과 시간)는 URL 쿼리 `?m=&d=&s=`에만 저장된다

## 명령

```bash
npm run dev        # 개발 서버 (http://localhost:3000/sudoku)
npm test           # Vitest 단위 테스트 (src/lib/sudoku)
npm run typecheck  # next typegen 후 tsc
npm run lint
npm run build
```

## 구조

- `src/lib/sudoku`: 규칙·풀이기·생성기·URL 코덱·게임 리듀서 (순수 로직, 테스트 대상)
- `src/components/sudoku`: 화면 컴포넌트와 훅
- `src/app/sudoku/page.tsx`: 유일한 페이지
