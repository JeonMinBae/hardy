# 워들 단어 데이터 출처

두 파일 모두 `node scripts/build-wordle-answers.mts` 로 다시 만든다. 칸 규칙은 `jamo.ts` 의 자모 28종(ㅐㅒㅔㅖ는 한 칸, 쌍자음·겹받침·그 밖의 모음 조합은 나눠서)을 따른다.

## 정답 `answers.json`

- 원저작물: 국립국어원, 「한국어 학습용 어휘 목록」(2003)
- 출처: https://www.korean.go.kr/front/etcData/etcDataView.do?mn_id=208&etc_seq=71 (텍스트 파일판 `etc_seq=70`)
- 라이선스: 공공누리 제1유형(출처표시) https://www.kogl.or.kr/info/license.do
- 원본 사본: `scripts/data/learner-vocabulary.txt` (EUC-KR)
- 가공 내용: 품사가 명사인 표제어에서 동음이의 번호를 떼고, 정확히 7칸인 단어만 남긴 뒤(자모열이 같으면 하나만), 시드 20260917로 섞어 출제 순서를 정했다.

## 제출 허용 단어 `allowed.json`

- 원저작물: 위 「한국어 학습용 어휘 목록」 전 품사, 그리고 국립국어원, 「현대 국어 사용 빈도 조사」(2002) 단어 빈도 목록
- 출처: https://www.korean.go.kr/front/etcData/etcDataView.do?mn_id=208&etc_seq=61
- 라이선스: 공공누리 제1유형(출처표시)
- 원본 사본: `scripts/data/frequency-words.txt` (EUC-KR, 배포 zip의 「단어_빈도순」 파일. 고유명사 목록은 쓰지 않는다)
- 가공 내용: 두 목록의 모든 품사 표제어에서 동음이의 번호를 떼고, 정확히 7칸인 단어를 모아 자모열이 같으면 하나만 남겼다(정답 표기 우선). 정답은 모두 포함된다.
