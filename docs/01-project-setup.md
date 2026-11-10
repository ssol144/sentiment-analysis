# 01. 프로젝트 생성 지침

> 목적: 폴더 구조, 설치, 환경변수, 기본 파일을 **정확히** 만든다.
> 이 문서의 구조 외에 폴더/파일을 임의로 추가하지 않는다.

---

## 1. 사용자가 미리 준비해야 하는 것 (에이전트가 확인 요청)

에이전트는 구현 시작 전에 아래가 준비되었는지 사용자에게 물어봅니다.

| 준비물 | 어디서 | 비고 |
|---|---|---|
| Node.js 20 이상 | nodejs.org (LTS 버전) | 터미널에서 `node -v` 로 확인 |
| OpenAI API 키 | platform.openai.com → API keys | 결제 수단 등록 필요, **월 한도 설정 권장** |
| Supabase 프로젝트 | supabase.com → New project | `Project URL`, `service_role` 키 필요 |
| Vercel 계정 | vercel.com | GitHub 연동 권장 |
| Git / GitHub 저장소 | github.com | 배포 연동용 |

> 키 값은 사용자가 `.env.local` 파일에 직접 붙여넣게 안내합니다. **채팅에 키를 붙여넣게 하지 마세요.**

---

## 2. 최종 폴더 구조 (이 구조 그대로 생성)

```
sentiment-project/
├─ AGENTS.md
├─ PRD.md
├─ docs/                      ← 지침 문서 (이미 존재)
├─ public/                    ← 브라우저에 보이는 파일 (비밀 키 금지!)
│  ├─ index.html
│  ├─ css/
│  │  ├─ tokens.css           ← 색상·글꼴·간격 변수
│  │  ├─ base.css             ← 기본 스타일, 레이아웃
│  │  ├─ blobs.css            ← 5개 카드의 모양
│  │  └─ components.css       ← 버튼, 입력창, 결과, 오류
│  ├─ js/
│  │  ├─ config.js            ← 앱 이름, 글자 수 제한 등 상수
│  │  ├─ api.js               ← 서버(/api/analyze)와 통신
│  │  ├─ ui.js                ← 화면 그리기(결과/오류/로딩)
│  │  └─ main.js              ← 이벤트 연결 (시작점)
│  └─ assets/
│     └─ faces.svg            ← 해바라기 표정 스티커 3종 (직접 그린 SVG)
├─ api/
│  └─ analyze.js              ← POST /api/analyze
├─ lib/
│  ├─ openai.js               ← OpenAI 호출 + 응답 검사
│  ├─ supabase.js             ← DB 저장
│  ├─ validate.js             ← 입력 검사
│  └─ errors.js               ← 오류 코드/메시지 정의
├─ .env.example               ← 가짜 값 예시 (Git에 올림)
├─ .env.local                 ← 진짜 키 (Git에 올리면 안 됨!)
├─ .gitignore
├─ package.json
└─ vercel.json
```

---

## 3. 단계별 생성 순서

### 단계 1 — 기본 뼈대
1. 위 폴더 구조의 **빈 폴더와 빈 파일**을 만든다.
2. `package.json`을 아래 내용으로 만든다.

```json
{
  "name": "sentiment-project",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "vercel dev"
  },
  "dependencies": {
    "openai": "latest",
    "@supabase/supabase-js": "latest"
  }
}
```

> `latest`는 설치 시점의 최신 안정 버전을 받습니다. 설치 후 `package.json`에 실제 버전 번호가 기록되었는지 확인합니다.

3. 터미널에서 `npm install` 실행.

**검증 ①**
- `node -v` 결과가 `v20` 이상이다
- `node_modules/openai`, `node_modules/@supabase/supabase-js` 폴더가 존재한다

### 단계 2 — 설정 파일

**`.gitignore`**
```
node_modules/
.env
.env.local
.env.*.local
.vercel/
.DS_Store
```

**`.env.example`** (가짜 값만!)
```
OPENAI_API_KEY=your-openai-key-here
OPENAI_MODEL=gpt-4o-mini
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**`.env.local`**: `.env.example`을 복사해서 만들고, **사용자가 직접** 진짜 값을 채운다.

**`vercel.json`**
```json
{
  "functions": {
    "api/analyze.js": { "maxDuration": 30 }
  }
}
```

**검증 ②**
- `git status`에 `.env.local`이 **나타나지 않는다** (무시되고 있다)
- `.env.example`에 진짜 키처럼 보이는 문자열이 없다

### 단계 3 — 화면 빈 껍데기
- `public/index.html`에 `<head>`(CSS 4개 연결, 폰트 연결)와 `<body>`(헤더 + 카드 5개 + 푸터 자리)만 만든다.
- 기능과 디자인 디테일은 이후 단계(`02`, `03` 문서)에서 구현한다.

**검증 ③**
- `npx vercel dev` 실행 후 `http://localhost:3000` 접속 시 빈 페이지가 오류 없이 열린다
  - 처음 실행하면 Vercel 로그인/프로젝트 연결 질문이 나온다. 에이전트는 **사용자에게 안내만** 하고 임의로 답하지 않는다.

---

## 4. 환경변수 규칙

| 이름 | 용도 | 사용 위치 | 브라우저 노출 |
|---|---|---|---|
| `OPENAI_API_KEY` | OpenAI 인증 | `lib/openai.js` | ❌ 절대 금지 |
| `OPENAI_MODEL` | 사용할 모델 이름 | `lib/openai.js` | ❌ |
| `SUPABASE_URL` | DB 주소 | `lib/supabase.js` | ❌ (서버에서만 사용) |
| `SUPABASE_SERVICE_ROLE_KEY` | DB 전체 권한 키 | `lib/supabase.js` | ❌ 절대 금지 |

- 코드는 `process.env.이름`으로만 읽는다. 키를 코드에 직접 쓰지 않는다.
- 필수 환경변수가 하나라도 없으면 서버는 **시작 시가 아니라 요청 시** `SERVER_CONFIG_ERROR`를 반환한다. (키 이름은 메시지에 노출해도 되지만 **값은 절대 노출 금지**)

> 모델 이름은 시간이 지나면 바뀔 수 있으므로 코드에 고정하지 않고 `OPENAI_MODEL`로 관리합니다. 기본값 `gpt-4o-mini`가 사용 불가하다는 오류가 나면, 에이전트는 OpenAI 공식 문서에서 현재 사용 가능한 모델을 확인해 사용자에게 **후보를 제시하고 선택을 요청**합니다.

---

## 5. 단계 1~3 완료기준

- [ ] 위 폴더 구조와 파일이 모두 존재한다 (이 문서에 없는 파일은 없다)
- [ ] `npm install`이 오류 없이 끝났다
- [ ] 허용된 패키지 2개 외에 다른 패키지가 `package.json`에 없다
- [ ] `.env.local`이 Git 추적 대상이 아니다
- [ ] `vercel dev` 로 `localhost:3000`이 열린다
