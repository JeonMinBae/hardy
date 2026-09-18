# 워들 정답 데이터 출처

- 파일: `answers.json`
- 원저작물: 국립국어원, 「한국어 학습용 어휘 목록」(2003)
- 출처: https://www.korean.go.kr/front/etcData/etcDataView.do?mn_id=208&etc_seq=71 (텍스트 파일판 `etc_seq=70`)
- 라이선스: 공공누리 제1유형(출처표시) https://www.kogl.or.kr/info/license.do
- 원본 사본: `scripts/data/learner-vocabulary.txt` (EUC-KR)
- 가공 내용: 품사가 명사인 표제어에서 동음이의 번호를 떼고, 기본 자모 24종으로 분해해 정확히 7자모인 단어만 남긴 뒤(자모열이 같으면 하나만), 시드 20260917로 섞어 출제 순서를 정했다.
- 다시 만들기: `node scripts/build-wordle-answers.mts`
