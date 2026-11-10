# 05. 데이터베이스(Supabase) 구현 지침

> 목적: 분석이 성공할 때마다 결과를 Supabase에 **저장만** 한다. (화면에 기록을 보여주는 기능은 만들지 않는다.)
> 담당 파일: `lib/supabase.js`
> 저장이 실패해도 **사용자에게는 분석 결과를 정상으로 보여준다.**

---

## 1. 사용자가 직접 해야 하는 일 (에이전트가 클릭 순서대로 안내)

에이전트는 아래 순서를 사용자에게 **번호 목록으로** 안내하고, 완료 확인을 받은 뒤 다음 작업으로 넘어간다.

1. supabase.com 로그인 → **New project** 클릭 → 프로젝트 이름/비밀번호/지역 입력 후 생성 (1~2분 대기)
2. 좌측 메뉴 **SQL Editor** 클릭 → **New query** 클릭
3. 이 문서 3번의 SQL을 붙여넣고 **Run** 클릭 → `Success` 표시 확인
4. 좌측 메뉴 **Table Editor** → `sentiment_analyses` 테이블이 보이는지 확인
5. 좌측 하단 **Project Settings → API** 이동
   - `Project URL` 복사 → `.env.local`의 `SUPABASE_URL`에 붙여넣기
   - `service_role` 키 복사 → `.env.local`의 `SUPABASE_SERVICE_ROLE_KEY`에 붙여넣기
   - ⚠️ `service_role` 키는 **모든 권한을 가진 비밀 키**입니다. 채팅, 스크린샷, GitHub에 공유하지 마세요.

> Supabase 화면 메뉴 이름은 업데이트로 바뀔 수 있습니다. 메뉴가 다르면 에이전트는 추측하지 말고 사용자에게 현재 화면을 설명해 달라고 요청합니다.

---

## 2. 저장하는 데이터

| 컬럼 | 의미 | 예시 |
|---|---|---|
| `id` | 자동 생성되는 고유 번호 | `b6f1…` |
| `input_text` | 사용자가 입력한 문장 (trim 적용) | "오늘 정말 행복했다" |
| `sentiment` | 결과 | `positive` |
| `confidence` | 신뢰도 (0~100 정수) | `95` |
| `reason` | AI가 쓴 분석 이유 | "행복했다는 표현이…" |
| `model` | 사용한 OpenAI 모델 이름 | `gpt-4o-mini` |
| `created_at` | 저장 시각 (자동) | `2026-11-10 14:03:22+00` |

저장하지 않는 것: IP 주소, 브라우저 정보, 사용자 식별 정보 (로그인이 없으므로 불필요)

---

## 3. 테이블 생성 SQL (Supabase SQL Editor에 그대로 붙여넣기)

```sql
-- 감성 분석 기록 테이블
create table if not exists public.sentiment_analyses (
  id          uuid primary key default gen_random_uuid(),
  input_text  text        not null check (char_length(input_text) between 1 and 500),
  sentiment   text        not null check (sentiment in ('positive', 'negative', 'neutral')),
  confidence  smallint    not null check (confidence between 0 and 100),
  reason      text        not null,
  model       text,
  created_at  timestamptz not null default now()
);

-- 최신순 조회를 대비한 인덱스
create index if not exists sentiment_analyses_created_at_idx
  on public.sentiment_analyses (created_at desc);

-- 보안: 행 단위 보안(RLS) 켜기
-- 정책(policy)을 하나도 만들지 않으므로, 브라우저용 공개 키(anon)로는 읽기/쓰기가 모두 막힌다.
-- 서버가 쓰는 service_role 키만 접근할 수 있다.
alter table public.sentiment_analyses enable row level security;
```

**왜 이렇게 하나요? (쉬운 설명)**
- RLS를 켜고 정책을 만들지 않으면, 인터넷의 누구도 공개 키로 이 표를 읽거나 쓸 수 없습니다.
- 우리 서버만 비밀 키(`service_role`)로 안전하게 저장합니다.
- **RLS를 끄거나 `anon`에 권한을 주는 정책을 추가하지 마세요.** 사용자의 입력 문장이 외부에 노출될 수 있습니다.

---

## 4. `lib/supabase.js` 구현 규격

```js
import { createClient } from "@supabase/supabase-js";

let client = null;   // 한 번 만들어서 재사용

function getClient() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase 환경변수(SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)가 없어요.");
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export async function saveAnalysis({ text, sentiment, confidence, reason, model }) {
  const { error } = await getClient()
    .from("sentiment_analyses")
    .insert({ input_text: text, sentiment, confidence, reason, model });
  if (error) throw new Error(`Supabase 저장 실패: ${error.message}`);
}
```

### 규칙
- `saveAnalysis`는 **성공 응답을 만들기 직전**에 호출한다. (분석이 실패했으면 저장하지 않는다)
- 호출하는 쪽(`api/analyze.js`)에서 `.catch()`로 감싸 **저장 실패가 사용자 응답을 막지 않게** 한다. (`04` 문서 7번 참고)
- 저장 실패 시 `console.error`에 **오류 메시지만** 남긴다. 사용자 입력 문장 전체나 키는 로그에 남기지 않는다.
- 저장 시간은 길어도 **분석 응답 시간을 크게 늘리지 않는다.** DB 저장이 5초 이상 걸리는 경우 사용자에게 응답이 늦어질 수 있으므로, 저장 호출에 5초 제한을 둔다. (`Promise.race`로 5초 후 포기하고 로그만 남김)
- `SELECT`(조회), `UPDATE`, `DELETE`는 **구현하지 않는다.** `insert`만 사용한다.

---

## 5. 개인정보 관련 규칙

- 사용자 입력 문장이 DB에 저장된다는 사실을 화면 5번 카드(청록)에 **반드시 안내**한다. (`02` 문서의 문구)
- 개인정보(주민번호, 비밀번호 등)를 입력하지 말라는 안내를 함께 표시한다.
- 에이전트는 사용자에게 다음을 **알려준다**: "이 서비스는 입력 문장을 저장합니다. 실제 서비스로 공개하려면 개인정보처리방침이 필요할 수 있어요. 공개 전에 법적 요구사항을 확인하세요."

---

## 6. 단계별 검증

### 검증 1 — 테이블 확인
- Supabase **Table Editor**에서 `sentiment_analyses`가 보이고 컬럼 7개가 위 표와 같다.
- Table Editor에서 RLS 상태가 **Enabled**로 표시된다.

### 검증 2 — 저장 확인
1. `vercel dev` 실행 중에 정상 분석을 1회 실행한다 (예: "오늘 정말 행복해!")
2. Supabase Table Editor에서 새로고침 → **1건이 추가**되어 있다
3. `input_text`, `sentiment`, `confidence`, `reason`, `model`, `created_at`이 모두 채워져 있다

### 검증 3 — 저장 실패 시에도 화면 정상 동작
1. `.env.local`의 `SUPABASE_SERVICE_ROLE_KEY`를 일부러 틀린 값으로 바꾸고 서버 재시작
2. 분석 실행 → **화면에는 결과가 정상 표시**된다
3. 서버 터미널에 "DB 저장 실패" 로그가 보이고, 키 값은 출력되지 않는다
4. **원래 키로 되돌린다.**

### 검증 4 — 보안 확인 (anon 접근 차단)
- 에이전트는 사용자에게 안내한다: Supabase **Project Settings → API**의 `anon public` 키가 `public/` 폴더나 브라우저 코드에 **전혀 사용되지 않았음**을 확인했다고 보고한다. (`grep -rn "supabase" public/` 결과 없음)

---

## 7. 완료기준 (DB)

- [ ] `sentiment_analyses` 테이블이 존재하고 RLS가 켜져 있다
- [ ] 분석 성공 1회당 정확히 1건이 저장된다 (중복 저장 없음)
- [ ] 분석 실패(입력 오류, OpenAI 오류) 시에는 저장되지 않는다
- [ ] DB 저장이 실패해도 사용자는 결과를 정상으로 본다
- [ ] 브라우저 코드(`public/`)에 Supabase 관련 코드/키가 없다
- [ ] `insert` 외 DB 명령을 사용하지 않았다
