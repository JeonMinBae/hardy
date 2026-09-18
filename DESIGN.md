---
version: 1
name: hardy-warm-paper
description: 흰 바탕에 인쇄한 퍼즐 지면. 따뜻함은 바탕이 아니라 잉크와 입력면, 액센트에서 온다. 세리프 제목과 또렷한 숫자, 얇은 테두리와 아주 엷은 그림자로 화면을 짠다. 게임마다 액센트 한 색만 다르다.

colors:
  light:
    canvas: "#ffffff" # 바탕
    surface: "#ffffff" # 카드·보드. 바탕과 같은 색이고 테두리·그림자로 구분한다
    sunken: "#f6f3ec" # 파고든 면. 숫자패드·키보드처럼 눌러 쓰는 영역. 유일하게 따뜻한 면
    ink: "#211d17" # 살짝 갈색기 도는 검정
    ink-muted: "#6a6152"
    line: "#e2dbcd" # 카드 테두리 같은 장식선. 그림자와 함께 쓴다
    line-strong: "#8d8475" # 격자선처럼 칸을 식별하는 선. 흰 바탕에서 3.7:1
    danger: "#a3322a"
  dark:
    canvas: "#0a0a0a"
    surface: "#171717"
    sunken: "#121212"
    ink: "#ededed"
    ink-muted: "#a1a1a1"
    line: "#2a2a2a"
    line-strong: "#666666" # 검정 바탕에서 3.5:1
    danger: "#ef8b7c"

accents: # 게임마다 한 색. [data-game] 이 --accent / --accent-soft 를 덮어쓴다
  sudoku: { light: "#a84a28", dark: "#e8906a", soft-light: "#f3e0d6", soft-dark: "#2c2019" }
  wordle: { light: "#2a6f62", dark: "#6fc0ae", soft-light: "#dceae5", soft-dark: "#12241f" }
  nonogram: { light: "#7f5c0d", dark: "#d7a63f", soft-light: "#f3e7cf", soft-dark: "#2b2211" }

verdict: # 판정·상태 공용 색. 글자는 어느 쪽이든 {colors.ink} 이고 배경만 바뀐다
  # ok = 맞음·완성(워들 정답, 스도쿠 완성 유닛), near = 부분 일치·부가 규칙 영역(워들 위치 틀림, X 대각선), off = 제외
  ok: { light: "#9dbe8c", dark: "#3f6b39" }
  near: { light: "#e6c877", dark: "#7d5f18" }
  off: { light: "#cac1b0", dark: "#3a3a3a" }

typography:
  display: # 화면 제목
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: 28px
    fontWeight: 600
    letterSpacing: -0.4px
  title: # 카드 제목·모달 제목
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: 18px
    fontWeight: 600
  body:
    fontFamily: "system-ui, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: 14px
    lineHeight: 1.5
  caption:
    fontFamily: "{typography.body.fontFamily}"
    fontSize: 12px
    color: "{colors.ink-muted}"
  numeral: # 격자 숫자·타이머·통계
    fontFamily: "Space Grotesk, ui-sans-serif, sans-serif"
    fontVariantNumeric: tabular-nums
    fontWeight: 500

radius: { xs: 4px, sm: 6px, md: 10px, lg: 14px, xl: 20px, pill: 9999px }

spacing: { xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 24px, section: 40px }

elevation:
  flat: none # 보드 격자·키 하나하나
  card: "0 1px 2px rgb(0 0 0 / .06), 0 10px 24px -18px rgb(0 0 0 / .35)" # 다크는 더 짙게 별도 정의
  dialog: "{elevation.card}"

motion:
  ease-out: "cubic-bezier(.2,.8,.2,1)"
  fast: 120ms # hover·색 전환
  base: 180ms # 선택 이동
  pop: 160ms # 숫자 입력
  shake: 320ms # 충돌·오답
  flip: 420ms # 워들 타일 한 칸

components:
  screen-header: # 게임 상단 줄: 제목 + 타이머 + 조작
    typography: "{typography.display}"
    borderBottom: "1px solid {colors.line}"
    padding: "{spacing.lg} {spacing.lg}"
  card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.line}"
    rounded: "{radius.lg}"
    shadow: "{elevation.card}"
    padding: "{spacing.lg}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{radius.md}"
    padding: "10px 16px"
    minHeight: 44px
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    border: "1px solid {colors.line-strong}"
    rounded: "{radius.md}"
    minHeight: 44px
  button-primary-active:
    backgroundColor: "{colors.accent}"
    transform: "scale(.97)"
  board:
    backgroundColor: "{colors.surface}"
    border: "2px solid {colors.ink-muted}" # 판 외곽과 3×3 경계는 같은 두께·같은 색
    rounded: "{radius.md}"
    overflow: hidden # 모서리를 넘어 칸 배경이 삐져나오지 않게
  board-cell:
    borderColor: "{colors.line-strong}" # 칸 사이 선
    typography: "{typography.numeral}"
    textColor: "{colors.ink}"
  board-cell-given: # 스도쿠에서 처음부터 주어진 숫자
    textColor: "{colors.ink}"
    fontWeight: 600
  board-cell-entered:
    textColor: "{colors.accent}"
    animation: "{motion.pop}"
  board-cell-hint: # 힌트로 채운 숫자. 입력과 색이 같아 밑줄로 구분한다
    textColor: "{colors.accent}"
    textDecoration: "dotted underline"
  board-cell-selected:
    backgroundColor: "{colors.accent} 30%"
    outline: "2px solid {colors.accent}"
  board-cell-same-number: # 선택한 칸과 같은 숫자
    backgroundColor: "{colors.accent} 15%"
  board-cell-peer: # 같은 행·열·박스
    backgroundColor: "{colors.sunken}"
  board-cell-completed: # 중복 없이 채워진 단위
    backgroundColor: "{verdict.ok} 30%"
  board-cell-diagonal: # X 스도쿠의 대각선
    backgroundColor: "{verdict.near} 20%"
  board-cell-conflict:
    textColor: "{colors.danger}"
    textDecoration: "wavy underline"
    animation: "{motion.shake}"
  pad-key:
    backgroundColor: "{colors.sunken}"
    border: "1px solid {colors.line}"
    rounded: "{radius.sm}"
    typography: "{typography.numeral}"
    minHeight: 44px
  wordle-tile:
    border: "1px solid {colors.line-strong}"
    rounded: "{radius.sm}"
    typography: "{typography.title}"
  wordle-tile-ok:
    backgroundColor: "{verdict.ok}"
    borderColor: "{colors.ink}"
    borderWidth: 2px # 색 외 단서
  wordle-tile-near:
    backgroundColor: "{verdict.near}"
    marker: "우상단 삼각 표식" # 색 외 단서
  wordle-tile-off:
    backgroundColor: "{verdict.off}"
    textColor: "{colors.ink-muted}"
  nonogram-cell-filled:
    backgroundColor: "{colors.ink}"
  nonogram-cell-marked: # 비었다고 표시한 칸
    textColor: "{colors.ink-muted}"
    glyph: "×"
  nonogram-clue-satisfied:
    textColor: "{colors.ink-muted}"
  dialog:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.line}"
    rounded: "{radius.xl}"
    shadow: "{elevation.dialog}"
    backdrop: "{colors.ink} 35%"
  focus-ring:
    outline: "2px solid {colors.accent}"
    outlineOffset: "2px"
---

# hardy DESIGN.md

에이전트와 사람이 같은 규칙으로 화면을 만들기 위한 문서다. 토큰 실물은 `src/app/globals.css` 의 CSS 변수이고, 위 YAML 이 그 의미를 정의한다. 값을 바꿀 일이 생기면 두 곳을 같이 고친다.

## 1. 분위기

흰 지면에 인쇄한 퍼즐. 화면은 조용하고, 움직이는 건 지금 손대는 칸뿐이다. 바탕은 흰색·검정으로 비워 두고, 따뜻함은 잉크의 갈색기와 눌러 쓰는 면(`sunken`), 액센트 한 색이 낸다. 파란 계열 UI는 쓰지 않는다.

## 2. 색

- `canvas` 와 `surface` 는 라이트에서 같은 흰색이다. 카드·보드는 면 색이 아니라 `line` 테두리와 `elevation.card` 로 구분한다. 다크에서는 `surface` 가 `canvas` 보다 한 단 밝다.
- 숫자패드·키보드처럼 눌러 쓰는 면만 `sunken` 으로 낮춘다. 라이트에서 유일하게 따뜻한 면이라 여기에 색을 더 얹지 않는다.
- 본문은 `ink`, 보조 설명은 `ink-muted`. 그 외 회색은 만들지 않는다.
- 선은 두 종류다. `line` 은 카드 테두리 같은 장식선이고, 격자처럼 칸을 식별해야 하는 선은 `line-strong` 을 쓴다(WCAG 1.4.11 의 3:1 을 넘기려면 이 값이어야 한다). 스도쿠 3×3 경계처럼 더 강한 구조선은 `ink-muted` 로 한 단 올린다.
- 액센트는 화면당 한 색이다. 게임 루트에 `data-game="sudoku" | "wordle" | "nonogram"` 을 달면 `--accent` 와 `--accent-soft` 가 그 게임 색으로 바뀌므로, 컴포넌트는 항상 `accent` 토큰만 참조한다. 특정 게임 색을 코드에 직접 적지 않는다.
- 대비는 WCAG AA 기준으로 맞춰 둔 값이다. 라이트에서 액센트 글자는 `canvas` 위 5.7:1, `sunken` 위 5.2:1 이고 다크는 모두 7:1 을 넘는다.

## 3. 타이포그래피

- 제목은 Fraunces(`font-display`), 격자 숫자·타이머·통계는 Space Grotesk(`font-numeral`)를 쓴다. 본문 한글은 시스템 폰트 그대로다 — 한글 웹폰트는 얹지 않는다.
- 숫자에는 `font-numeral` 과 `tabular-nums` 를 함께 준다. 폭이 흔들리면 타이머가 1초마다 들썩인다.
- 굵기는 400·500·600만 쓴다. 세리프를 700으로 키우지 않는다.

## 4. 레이아웃

- 화면은 `max-w-md` 한 칸 컬럼을 유지한다. 이번 개선에서 화면 구성과 조작 방식은 바꾸지 않는다.
- 세로 리듬은 `spacing.lg`(요소 사이) → `spacing.section`(구역 사이) 두 단계로만 나눈다.
- 보드는 화면에서 가장 큰 덩어리다. 보드 위아래 여백을 컨트롤보다 넉넉히 줘서 시선이 보드에 먼저 닿게 한다.

## 5. 깊이

종이를 겹쳐 놓은 정도로만 표현한다. 구조는 선이 말하고, 그림자는 카드와 모달이 떠 있다는 힌트만 준다.

- 보드 격자·키 한 칸은 그림자 없음. 테두리와 면 색으로만 구분한다.
- 카드·모달만 `elevation.card` 를 쓴다. 그 이상 진한 그림자는 만들지 않는다.
- 다크에서는 그림자가 거의 보이지 않는다. 대신 `surface` 가 `canvas` 보다 밝아서 그 면 차이가 층을 만든다.

## 6. 형태

- 반지름: 칸·키는 `radius.sm`, 보드·버튼은 `radius.md`, 카드는 `radius.lg`, 모달은 `radius.xl`.
- 격자 안쪽 선은 `line-strong`, 3×3 블록이나 5칸 묶음 같은 구조선은 `ink-muted` 로 한 단계 진하게. 카드 테두리에만 `line` 을 쓴다.
- 터치 대상은 최소 44px. 숫자패드·키보드 키는 이 값을 밑돌지 않는다.

## 7. 상태 표시

색만으로 상태를 말하지 않는다. 색이 안 보여도 화면이 읽혀야 한다.

| 상태 | 색 | 색 외 단서 |
| --- | --- | --- |
| 선택한 칸 | `accent` 30% 배경 | `accent` 2px 아웃라인 |
| 같은 숫자 | `accent` 15% 배경 | — (선택 칸과 세기로 구분) |
| 같은 행·열·박스 | `sunken` 배경 | — (선택 칸과 세기로 구분) |
| 힌트로 채운 숫자 | `accent` 글자(입력과 같음) | 점선 밑줄 |
| 충돌한 숫자 | `danger` 글자 | 물결 밑줄 + 짧은 흔들림 |
| 완성된 단위 | `ok` 30% 배경 | — (칸이 다 채워진 것 자체가 단서) |
| X 대각선 | `near` 20% 배경 | — (규칙 영역 표시) |
| 워들 정답 | `ok` 배경 | `ink` 2px 테두리 |
| 워들 위치 틀림 | `near` 배경 | 우상단 삼각 표식 |
| 워들 없음 | `off` 배경 | 글자를 `ink-muted` 로 |
| 노노그램 충족 단서 | `ink-muted` 글자 | 흐려짐 |

포커스 링은 `focus-ring` 토큰을 그대로 쓴다. 키보드로 조작하는 화면이라 링을 지우지 않는다.

## 8. 모션

- 상태 전환은 `motion.fast`~`base`, 이징은 `ease-out` 하나만 쓴다.
- 워들: 제출하면 타일이 왼쪽부터 `motion.flip` 으로 한 칸씩 뒤집히며 판정색이 드러난다. 칸 간격은 약 100ms. 목록에 없는 단어면 그 줄이 `motion.shake` 로 흔들린다.
- 스도쿠: 숫자를 놓으면 `motion.pop`, 같은 행·열·박스에 중복이 생기면 해당 칸이 `motion.shake`.
- 그 외 등장 애니메이션은 넣지 않는다. 완료 시 폭죽은 기존 동작을 유지한다.
- `prefers-reduced-motion: reduce` 는 `globals.css` 에서 전역으로 꺼진다. 개별 컴포넌트에서 다시 켜지 않는다.

## 9. Do / Don't

**Do**

- 색은 반드시 토큰으로 쓴다. `bg-canvas` `text-ink-muted` `border-line` 처럼.
- 게임 화면 루트에 `data-game` 을 달고, 강조는 `accent` 로만 한다.
- 새 상태를 만들면 색과 함께 색 외 단서를 하나 정한다.
- 숫자는 `font-numeral tabular-nums`, 제목은 `font-display`.

**Don't**

- Tailwind 팔레트(`slate-500`, `sky-600` 등)를 직접 쓰지 않는다. 토큰이 없으면 토큰을 먼저 추가한다.
- 바탕에 크림 틴트를 넣지 않는다. 흰 바탕은 의도한 선택이고, 따뜻함은 `sunken` 과 액센트가 낸다.
- 격자선에 `line` 을 쓰지 않는다. 너무 옅어서 칸이 안 보인다.
- 게임별 색을 컴포넌트에 하드코딩하지 않는다.
- hover 로만 알 수 있는 정보를 만들지 않는다. 터치에서는 hover 가 없다.
- 그림자를 층층이 쌓지 않는다. 뜨는 것은 카드와 모달뿐이다.

## 10. 반응형

- 기준은 모바일 세로. 보드는 가용 폭에 맞춰 정사각으로 줄어들고, 최소 터치 크기를 못 지키면 칸 대신 여백을 줄인다.
- 넓은 화면에서도 컬럼 폭은 `max-w-md` 를 넘기지 않는다. 남는 폭은 여백으로 둔다.
- 노노그램 20×20 처럼 폭을 넘기는 보드는 기존 확대·두 손가락 이동을 유지한다.

## 11. 작업 가이드

1. 한 번에 컴포넌트 하나만 손댄다. YAML 의 키(`{components.board-cell-selected}`)를 기준으로 이야기한다.
2. 변형(`-selected`, `-conflict`, `-active`)은 별도 키로 추가한다.
3. 색·간격·반지름은 토큰 참조로 쓰고 코드에 값을 적지 않는다.
4. 기본 상태와 눌린/활성 상태만 정의한다. hover 는 문서화하지 않는다.
5. 라이트·다크 두 모드에서 모두 확인한 뒤 끝낸 것으로 친다.

## 12. 남은 구멍

- 홈 화면(`/`)은 이번 범위 밖이다. 전역 토큰과 폰트는 따라 적용되지만 카드·제목 스타일은 예전 그대로다.
- 노노그램 줄 완성 피드백, 화면 등장 연출은 의도적으로 넣지 않았다.
- 다크 모드 수동 토글은 없다. OS 설정만 따른다.
- `--color-background` / `--color-foreground` 는 옛 코드가 남아 있는 동안만 두는 별칭이다. 새로 쓰지 않는다.
