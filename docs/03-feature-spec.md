# 03. 기능 구현 지침

> 목적: "버튼을 누르면 → 결과가 보이기까지"의 **브라우저 쪽 동작**을 정확히 정의한다.
> 서버/OpenAI/DB 쪽은 `04`, `05` 문서를 따른다.
> 이 문서는 `public/js/` 폴더의 파일 4개(`config.js`, `api.js`, `ui.js`, `main.js`)를 다룬다.

---

## 1. 전체 흐름 (한눈에 보기)

```
[사용자 입력]
     │
     ▼
① 입력 검사 (브라우저)  ── 실패 → 입력 오류 메시지 표시, 끝
     │ 통과
     ▼
② 로딩 상태로 전환 (버튼 비활성화, "분석 중...")
     │
     ▼
③ POST /api/analyze  { text }
     │
     ├─ 성공(200) → ④ 결과 화면 표시 (결과 단어, 표정, 신뢰도, 이유)
     │
     └─ 실패 / 네트워크 오류 → ⑤ 서버 오류 메시지 표시
     │
     ▼
⑥ 로딩 상태 해제 (성공이든 실패든 반드시 실행)
```

---

## 2. 파일별 역할과 필수 함수

### `public/js/config.js` — 상수 모음
```js
export const APP_NAME = "마음 온도계";
export const MAX_LENGTH = 500;
export const REQUEST_TIMEOUT_MS = 25000;   // 브라우저 쪽 대기 한도 (서버 20초 + 여유)
export const API_URL = "/api/analyze";

export const SENTIMENT_LABELS = {
  positive: "긍정",
  negative: "부정",
  neutral:  "중립",
};

export const FACE_IDS = {
  positive: "face-positive",
  negative: "face-negative",
  neutral:  "face-neutral",
};
```

### `public/js/api.js` — 서버와 통신만 담당
- 함수: `analyzeText(text)` → `Promise<{ sentiment, confidence, reason }>`
- 동작:
  1. `fetch(API_URL, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ text }) })`
  2. `AbortController`로 `REQUEST_TIMEOUT_MS` 초과 시 중단
  3. 응답이 `ok`면 JSON을 반환
  4. 응답이 `ok`가 아니면 서버가 준 `{ error: { code, message } }`를 읽어 **`ApiError`(code, message 포함)**를 던진다
  5. 네트워크 오류/시간 초과/JSON 파싱 실패는 아래 오류 코드로 변환해서 던진다
     - 인터넷 끊김 등 `fetch` 자체 실패 → `NETWORK_ERROR`
     - 시간 초과(`AbortError`) → `TIMEOUT`
     - 응답이 JSON이 아님 → `BAD_RESPONSE`
- 이 파일은 **화면(DOM)을 절대 건드리지 않는다.**

### `public/js/ui.js` — 화면 그리기만 담당
아래 함수를 **이 이름 그대로** 만든다. (UI 검증 시 콘솔에서 호출하기 위해)

| 함수 | 하는 일 |
|---|---|
| `showIdle()` | ① 처음 상태로 되돌림 |
| `showLoading()` | ② 분석 중 상태 (버튼 비활성화, 문구 변경, 스티커 흔들림) |
| `showResult({ sentiment, confidence, reason })` | ③ 성공 상태 |
| `showInputError(message)` | ④ 입력 오류 (`#input-error`에 표시) |
| `showServerError(message)` | ⑤ 서버/네트워크 오류 (`#server-error`에 표시) |
| `clearErrors()` | 두 오류 박스 모두 숨김 |
| `updateCharCount(length)` | `#char-count`를 `"{length} / 500"`으로 갱신 |

**표시 규칙 (정확히 지킬 것)**
- 결과 단어: `SENTIMENT_LABELS[sentiment]` → `#result-label`의 **`textContent`**로 설정 (`innerHTML` 금지)
- 스티커: `#result-sticker use`의 `href`를 `/assets/faces.svg#${FACE_IDS[sentiment]}`로 변경
- 신뢰도 숫자: `신뢰도 ${confidence}%` → `#confidence-text`
- 신뢰도 막대: `#confidence-bar`의 `style.width = confidence + "%"`, 그리고 `role="progressbar"` 요소의 `aria-valuenow` 갱신
- 이유 문장: `#reason-text.textContent = reason`
- `#meter`(신뢰도 영역)는 성공 상태에서만 보이게(`hidden` 해제)
- 처음/분석 중/오류 상태에서는 이전 결과를 **반드시 지운다** (이전 결과가 남아 있으면 안 됨)
- 알 수 없는 `sentiment` 값이 들어오면 `neutral`로 취급하지 말고 **`showServerError`로 처리**한다 (잘못된 결과를 보여주지 않음)

### `public/js/main.js` — 이벤트 연결 (시작점)
- 페이지 로드 시: `showIdle()`, `updateCharCount(0)` 실행
- `#text-input`의 `input` 이벤트 → `updateCharCount(현재 글자 수)` (공백 제거 전 전체 길이로 표시), 입력 오류 박스가 보이는 중이면 숨김
- `#analyze-form`의 `submit` 이벤트 → 기본 동작(`preventDefault`) 막고 아래 **제출 처리 절차** 실행

---

## 3. 제출 처리 절차 (`main.js`의 `handleSubmit`)

```
1. 이미 분석 중이면 → 아무것도 하지 않고 종료 (중복 방지)
2. text = textarea 값.trim()
3. 입력 검사:
   - text 길이가 0      → showInputError("문장을 입력해주세요.") 후 종료
   - text 길이가 500 초과 → showInputError("500자 이하로 입력해주세요.") 후 종료
4. clearErrors(); showLoading()
5. try {
     result = await analyzeText(text)
     showResult(result)
   } catch (err) {
     showServerError(오류 메시지 표 참고)
   } finally {
     분석 중 상태 해제 (버튼 다시 활성화)   ← 반드시 실행
   }
```

- 입력 검사에 실패한 경우 **서버로 요청을 보내지 않는다.**
- "분석 중" 여부는 `let isLoading = false` 변수로 관리한다.
- 성공 후 입력창 내용은 **지우지 않는다.** (사용자가 이어서 고칠 수 있게)

---

## 4. 오류 메시지 표 (문구 고정)

화면에 보이는 문구는 **이 표의 문구를 그대로** 사용한다.

| 오류 코드 | 어디서 발생 | 화면 표시 문구 | 표시 위치 |
|---|---|---|---|
| (브라우저 검사) 빈 입력 | 브라우저 | 문장을 입력해주세요. | 입력 오류 박스 |
| (브라우저 검사) 길이 초과 | 브라우저 | 500자 이하로 입력해주세요. | 입력 오류 박스 |
| `EMPTY_TEXT` | 서버 | 문장을 입력해주세요. | 입력 오류 박스 |
| `TEXT_TOO_LONG` | 서버 | 500자 이하로 입력해주세요. | 입력 오류 박스 |
| `NETWORK_ERROR` | 브라우저 | 인터넷 연결을 확인하고 다시 시도해주세요. | 서버 오류 박스 |
| `TIMEOUT` | 브라우저 | 응답이 너무 오래 걸려요. 잠시 후 다시 시도해주세요. | 서버 오류 박스 |
| `RATE_LIMIT` | 서버 | 요청이 많아요. 잠시 후 다시 시도해주세요. | 서버 오류 박스 |
| `OPENAI_ERROR` | 서버 | AI 분석 중 문제가 생겼어요. 잠시 후 다시 시도해주세요. | 서버 오류 박스 |
| `INVALID_AI_RESPONSE` | 서버 | AI 응답을 이해하지 못했어요. 다시 시도해주세요. | 서버 오류 박스 |
| `SERVER_CONFIG_ERROR` | 서버 | 서비스 설정에 문제가 있어요. 관리자에게 문의해주세요. | 서버 오류 박스 |
| `METHOD_NOT_ALLOWED` | 서버 | 잘못된 요청이에요. 페이지를 새로고침해주세요. | 서버 오류 박스 |
| `BAD_RESPONSE` | 브라우저 | 서버 응답을 읽지 못했어요. 다시 시도해주세요. | 서버 오류 박스 |
| 그 외 모든 경우 | 어디서든 | 알 수 없는 오류가 생겼어요. 잠시 후 다시 시도해주세요. | 서버 오류 박스 |

**구현 방법**: 오류 코드 → 문구 변환은 `public/js/config.js`에 `ERROR_MESSAGES` 객체 **한 곳**에 모은다. 서버가 보낸 `message`를 그대로 화면에 쓰지 말고, **코드로 이 표를 찾아서** 표시한다. (서버 내부 정보가 화면에 새는 것을 방지)

---

## 5. 데이터 규격 (브라우저가 받는 성공 응답)

```json
{
  "sentiment": "positive",
  "confidence": 87,
  "reason": "행복하고 즐거웠다는 표현이 여러 번 나와 긍정적으로 판단했어요."
}
```

| 필드 | 타입 | 허용 값 | 브라우저에서 추가 검사 |
|---|---|---|---|
| `sentiment` | 문자열 | `positive` / `negative` / `neutral` 중 하나 | 3개 외 값이면 오류 처리 |
| `confidence` | 정수 | 0 ~ 100 | 숫자가 아니거나 범위 밖이면 오류 처리 |
| `reason` | 문자열 | 비어 있지 않음 | 비어 있으면 "이유를 받지 못했어요." 표시 (결과는 정상 표시) |

- 검사 실패 시 오류 코드는 `INVALID_AI_RESPONSE`로 간주한다.

---

## 6. 구현 순서와 단계별 검증

### 단계 A — 상수와 UI 함수 (`config.js`, `ui.js`)
- 위 함수 7개를 구현한다.
- **검증 A**: 브라우저 콘솔에서 아래를 차례로 실행했을 때 화면이 `02` 문서의 상태 5종대로 바뀐다.
  ```js
  const ui = await import('/js/ui.js');
  ui.showLoading();
  ui.showResult({ sentiment: 'positive', confidence: 87, reason: '테스트 이유' });
  ui.showResult({ sentiment: 'negative', confidence: 60, reason: '테스트 이유' });
  ui.showInputError('문장을 입력해주세요.');
  ui.showServerError('인터넷 연결을 확인하고 다시 시도해주세요.');
  ui.showIdle();
  ```

### 단계 B — 입력 처리 (`main.js`의 입력 부분)
- 글자 수 카운터, 빈 입력/500자 초과 검사까지 구현. (아직 서버 연결 안 함)
- **검증 B**
  - 아무것도 안 쓰고 "분석하기" → "문장을 입력해주세요." 표시
  - 공백만 입력하고 "분석하기" → 같은 메시지 표시
  - 501자 붙여넣고 "분석하기" → "500자 이하로 입력해주세요." 표시
  - 위 3가지 모두 개발자도구 Network 탭에 `/api/analyze` 요청이 **생기지 않는다**

### 단계 C — 서버 연결 (`api.js` + `main.js` 연결)
- `04` 문서의 서버 API가 만들어진 뒤에 진행한다.
- **검증 C**: `06` 문서의 테스트 케이스 T1~T10을 실행한다.

---

## 7. 완료기준 (기능)

- [ ] `ui.js`의 함수 7개가 존재하고 이름이 동일하다
- [ ] 제출 중 버튼이 비활성화되고, 성공/실패 어느 경우에도 다시 활성화된다
- [ ] 분석 중 두 번째 제출이 무시된다 (Network 탭에서 요청 1건만 확인)
- [ ] 결과 → 오류 → 결과 순으로 연속 실행해도 이전 화면 내용이 남지 않는다
- [ ] 사용자 입력/AI 응답을 화면에 넣을 때 `innerHTML`을 사용한 곳이 0건이다 (`grep -rn "innerHTML" public/` 결과 없음)
- [ ] 오류 문구가 4번 표와 정확히 같다
- [ ] `alert()`, `prompt()`를 사용하지 않는다 (오류는 화면 안에 표시)

---

## 8. 하지 말 것

- ❌ 분석 기록 목록/히스토리 화면 만들기
- ❌ 로컬스토리지(`localStorage`)에 입력/결과 저장
- ❌ 서버 응답을 기다리지 않고 임의의 가짜 결과 미리 보여주기
- ❌ OpenAI를 브라우저에서 직접 호출하기 (반드시 `/api/analyze`를 거친다)
- ❌ 자동 재시도 (사용자가 버튼을 다시 눌러야 함)
