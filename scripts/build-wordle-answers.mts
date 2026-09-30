// 워들 정답 목록(answers.json)과 제출 허용 목록(allowed.json)을 만든다: node scripts/build-wordle-answers.mts
// 원본은 모두 국립국어원 자료 txt(EUC-KR, 탭 구분)
// - 학습용 어휘 목록: 순위·단어·품사·풀이·등급
// - 현대 국어 사용 빈도 조사(단어): 차례·항목·풀이·품사·빈도…
import { readFileSync, writeFileSync } from "node:fs";
import { decompose } from "../src/lib/wordle/jamo.ts";

const LEARNER = new URL("./data/learner-vocabulary.txt", import.meta.url);
const FREQUENCY = new URL("./data/frequency-words.txt", import.meta.url);
const ANSWERS_OUTPUT = new URL("../src/lib/wordle/answers.json", import.meta.url);
const ALLOWED_OUTPUT = new URL("../src/lib/wordle/allowed.json", import.meta.url);
const WORD_LENGTH = 7;
// 출제 순서를 정하는 시드. 바꾸면 이미 나간 번호의 정답이 달라진다
const SEED = 20260917;

// 스도쿠의 mulberry32·shuffle 과 공유하지 않는다. 그쪽이 바뀌어도 출제 순서가 바뀌면 안 된다
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 표제어·품사 열 위치를 받아 [단어, 품사] 목록을 읽는다 */
function readEntries(source: URL, wordColumn: number, posColumn: number): [string, string][] {
  const text = new TextDecoder("euc-kr").decode(readFileSync(source));
  return text
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split("\t"))
    .filter((columns) => columns.length > posColumn)
    // 표제어 끝의 숫자는 동음이의 번호다(가격03)
    .map((columns) => [columns[wordColumn].replace(/\d+$/, ""), columns[posColumn]]);
}

/** 7자모 단어만 남기고, 자모열이 같으면 먼저 나온 표기 하나만 둔다 */
function addWords(wordByJamo: Map<string, string>, words: string[]) {
  for (const word of words) {
    const jamo = decompose(word);
    if (jamo?.length !== WORD_LENGTH) continue;
    const key = jamo.join("");
    if (!wordByJamo.has(key)) wordByJamo.set(key, word);
  }
}

const learner = readEntries(LEARNER, 1, 2);
const answerByJamo = new Map<string, string>();
addWords(answerByJamo, learner.filter(([, pos]) => pos === "명").map(([word]) => word));

const answers = [...answerByJamo.values()];
const random = mulberry32(SEED);
for (let i = answers.length - 1; i > 0; i--) {
  const j = Math.floor(random() * (i + 1));
  [answers[i], answers[j]] = [answers[j], answers[i]];
}

// 정답 표기가 먼저 들어가야 같은 자모열의 다른 표기(각각 → 가깍)로 덮이지 않는다
const allowedByJamo = new Map(answerByJamo);
addWords(allowedByJamo, learner.map(([word]) => word));
addWords(allowedByJamo, readEntries(FREQUENCY, 1, 3).map(([word]) => word));
const allowed = [...allowedByJamo.values()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

writeFileSync(ANSWERS_OUTPUT, `${JSON.stringify(answers, null, 2)}\n`);
writeFileSync(ALLOWED_OUTPUT, `${JSON.stringify(allowed, null, 2)}\n`);
console.log(`정답 ${answers.length}개, 허용 단어 ${allowed.length}개를 썼습니다`);
