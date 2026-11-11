# 02. UI 구현 지침

> 목적: 첨부된 참고 이미지("Andre Font" 사이트)의 **분위기와 구조**를 감성 분석 서비스에 맞게 구현한다.
> 이 문서의 색상·모양·문구는 **정해진 값**이다. 임의로 바꾸지 않는다.

---

## 1. 참고 이미지 분석 (무엇을 따라 하는가)

참고 이미지는 **검은 배경 위에 세로로 쌓인 5개의 큰 컬러 덩어리(블롭) 카드**로 이루어진 모바일 화면입니다.

| 요소 | 참고 이미지에서 보이는 것 | 이 프로젝트에서의 적용 |
|---|---|---|
| 배경 | 거의 검은색 | `--bg` 검정 배경 |
| 상단 바 | 가운데 제목 "Andre Font", 왼쪽 작은 로고, 오른쪽 "Sound on" | 가운데 서비스명, 왼쪽 "소개" 링크, **오른쪽은 비워둠(Sound 기능 없음)** |
| 카드 1 (노랑) | 구름처럼 물결진 가장자리, "Andre" 큰 글씨 | 서비스 제목 카드 |
| 카드 2 (보라) | 아래로 물방울이 뚝뚝 떨어지는 모양, 오른쪽 위에 흰 눈알 | 문장 입력 카드 |
| 카드 3 (분홍) | 양옆에 머그컵 손잡이, 위쪽에 흰 크림이 흐르는 모양 | 결과 카드 |
| 카드 4 (주황) | 출렁이는 불규칙한 모양, 흰 리본이 X자로 묶임 | 신뢰도·이유 카드 |
| 카드 5 (청록) | 구름 모양, "Studio JT" 큰 글씨 | 안내 카드 |
| 글자 | 두껍고 통통한 둥근 검정 글씨, 카드 안 가운데 정렬 | 같은 느낌의 무료 글꼴 사용 |
| 장식 | 해바라기 모양 얼굴 스티커가 카드 모서리에 겹쳐 있음 | 표정이 바뀌는 해바라기 스티커 (직접 그린 SVG) |
| 작은 글씨 | 카드 큰 제목 아래 아주 작은 설명 | 카드 아래 짧은 안내 문구 |
| 푸터 | 왼쪽 저작권, 오른쪽 링크 2개 | 왼쪽 서비스명, 오른쪽 링크 없음 또는 "맨 위로" |

### ⚠️ 저작권 주의
- 참고 이미지의 **Andre 글꼴 파일, 로고, 해바라기 캐릭터 그림, 카드 그림 파일은 복사/추출해서 사용하지 않는다.**
- 같은 "느낌"을 **CSS와 직접 그린 SVG, 무료 글꼴**로 새로 만든다.

---

## 2. 디자인 토큰 (`public/css/tokens.css`에 그대로 작성)

```css
:root {
  /* 색상 (참고 이미지에서 추출한 근사값) */
  --bg:        #0f0f0f;   /* 페이지 배경: 검정 */
  --ink:       #111111;   /* 카드 위 글씨: 진한 검정 */
  --paper:     #ffffff;   /* 흰색 장식, 입력창 배경 */
  --yellow:    #f5e960;   /* 카드 1 */
  --purple:    #8b67f0;   /* 카드 2 */
  --pink:      #f29bb5;   /* 카드 3 */
  --orange:    #f07f3f;   /* 카드 4 */
  --teal:      #4db5a5;   /* 카드 5 */
  --sun:       #f2c200;   /* 해바라기 꽃잎 */
  --error:     #ff5a5f;   /* 오류 강조 (배경이 어두운 곳에서 사용) */

  /* 글꼴 (Google Fonts, 무료) */
  --font-display: "Jua", "Fredoka", system-ui, sans-serif;   /* 큰 제목: 통통한 둥근 글씨 */
  --font-body:    "Noto Sans KR", system-ui, sans-serif;     /* 본문 */

  /* 글자 크기 */
  --fs-title:  clamp(2.6rem, 12vw, 4.2rem);  /* 카드 큰 제목 */
  --fs-result: clamp(2.2rem, 10vw, 3.4rem);  /* 결과 단어 */
  --fs-body:   1rem;                          /* 본문 16px */
  --fs-small:  0.8125rem;                     /* 작은 안내 13px */

  /* 간격·크기 */
  --gap-card:  20px;      /* 카드 사이 간격 */
  --page-max:  560px;     /* 콘텐츠 최대 너비 (데스크톱에서도 가운데 좁게) */
  --page-pad:  12px;      /* 화면 좌우 여백 */
  --radius-ui: 999px;     /* 버튼 둥글기 */
}
```

### 글꼴 불러오기 (`index.html`의 `<head>`)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jua&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
```
- 글꼴이 로드되기 전에도 읽을 수 있도록 `font-display: swap`(위 URL의 `display=swap`)을 유지한다.
- **글꼴 규칙**: 큰 제목·결과·버튼은 `--font-display`, 나머지 모든 글씨는 `--font-body`.

---

## 3. 전체 레이아웃

```
┌──────────────────────────────┐
│ [소개]     마음 온도계          │  ← 상단 바 (고정 X, 일반 흐름)
├──────────────────────────────┤
│   ╭~~~~~~~~~~~~~~~~~~~~~~╮   │
│  (   카드1 노랑: 제목       )  │
│   ╰~~~~~~~~~~~~~~~~~~~~~~╯   │
│   ╭──────────────────────╮ 👁 │
│   │ 카드2 보라: 입력       │   │
│   ╰┬─┬──┬──┬────┬─┬──────╯   │
│     ╵ ╵  ╵  ╵    ╵ ╵ (물방울)  │
│  ╭╌╮╭──────────────────╮╭╌╮  │
│  │ ││ 카드3 분홍: 결과    ││ │  │ ← 머그 손잡이
│  ╰╌╯╰──────────────────╯╰╌╯  │
│   ╭ ╲╲ 카드4 주황 ╱╱ ╮         │ ← 리본 X
│   ╰───────────────────╯      │
│   ╭~~~~~~~~~~~~~~~~~~~~~~╮   │
│  (   카드5 청록: 안내       )  │
│   ╰~~~~~~~~~~~~~~~~~~~~~~╯   │
├──────────────────────────────┤
│ © 2026 마음 온도계            │
└──────────────────────────────┘
```

- **모바일 우선**: 기본 스타일은 360px 기준으로 작성하고, 넓어질수록 여백만 늘린다.
- 데스크톱에서도 콘텐츠는 `max-width: var(--page-max)`로 **가운데 정렬**한다. 양옆은 검정 배경.
- 카드는 **항상 한 줄에 1개**(세로 쌓기). 가로 배치 금지.
- 카드 사이 간격: `var(--gap-card)`.
- 카드 안의 글씨는 **가운데 정렬**.
- `<body>`에서 **가로 스크롤이 생기면 안 된다.** (물방울/손잡이 같은 튀어나온 장식 때문에 생기기 쉬움 → 바깥 `<main>`에 `overflow-x: clip` 적용)

---

## 4. HTML 구조 (`public/index.html` body)

반드시 아래 구조·`id`를 사용한다. (JS가 이 id를 사용함)

```html
<header class="topbar">
  <a class="topbar__about" href="#card-guide">소개</a>
  <h1 class="topbar__title">마음 온도계</h1>
  <span class="topbar__spacer" aria-hidden="true"></span>
</header>

<main class="page">

  <!-- 카드 1: 노랑 / 제목 -->
  <section class="card card--yellow" aria-labelledby="hero-title">
    <h2 id="hero-title" class="card__title">마음 온도계</h2>
    <p class="card__caption">문장을 쓰면 AI가 마음의 온도를 재줘요.</p>
    <svg class="sticker sticker--hero" aria-hidden="true"><use href="/assets/faces.svg#face-positive"/></svg>
  </section>

  <!-- 카드 2: 보라 / 입력 -->
  <section class="card card--purple" id="card-input" aria-labelledby="input-title">
    <h2 id="input-title" class="card__title">써보기</h2>
    <form id="analyze-form" novalidate>
      <label for="text-input" class="visually-hidden">분석할 문장</label>
      <textarea id="text-input" name="text" rows="4" maxlength="600"
        placeholder="오늘 어땠는지 한 줄 써주세요"></textarea>
      <p id="char-count" class="char-count" aria-live="off">0 / 500</p>
      <p id="input-error" class="field-error" role="alert" hidden></p>
      <button id="submit-btn" type="submit" class="btn">분석하기</button>
    </form>
  </section>

  <!-- 카드 3: 분홍 / 결과 -->
  <section class="card card--pink" id="card-result" aria-labelledby="result-title">
    <h2 id="result-title" class="visually-hidden">분석 결과</h2>
    <div id="result-area" aria-live="polite">
      <p id="result-placeholder" class="card__title">결과</p>
      <p class="card__caption" id="result-caption">문장을 입력하면 여기에 결과가 나와요.</p>
      <!-- 결과가 있을 때: <p id="result-label" class="card__title result-label">긍정</p> -->
    </div>
    <p id="server-error" class="server-error" role="alert" hidden></p>
    <svg id="result-sticker" class="sticker sticker--result" aria-hidden="true"><use href="/assets/faces.svg#face-neutral"/></svg>
  </section>

  <!-- 카드 4: 주황 / 신뢰도 + 이유 -->
  <section class="card card--orange" aria-labelledby="detail-title">
    <h2 id="detail-title" class="card__title">이유</h2>
    <div class="meter" hidden id="meter">
      <p id="confidence-text" class="meter__text">신뢰도 0%</p>
      <div class="meter__track" role="progressbar" aria-label="신뢰도"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div id="confidence-bar" class="meter__fill"></div>
      </div>
    </div>
    <p id="reason-text" class="reason">분석 결과가 나오면 신뢰도와 이유를 알려드려요.</p>
  </section>

  <!-- 카드 5: 청록 / 안내 -->
  <section class="card card--teal" id="card-guide" aria-labelledby="guide-title">
    <h2 id="guide-title" class="card__title">안내</h2>
    <p class="card__caption">
      AI의 판단은 참고용이에요. 입력한 문장과 분석 결과는 서비스 개선을 위해 저장돼요.
      개인정보나 비밀번호는 쓰지 마세요.
    </p>
  </section>

</main>

<footer class="footer"><small>© 2026 마음 온도계</small></footer>

<script type="module" src="/js/main.js"></script>
```

- 카드 안의 `h2`는 모두 **큰 제목 스타일(`.card__title`)**을 쓴다.
- 문구는 위 텍스트를 그대로 사용한다. 바꾸고 싶으면 사용자에게 먼저 묻는다.

---

## 5. 카드별 모양 구현 방법

> 모든 모양은 **CSS + 인라인 SVG**로 만든다. 이미지 파일(png/jpg)을 쓰지 않는다.
> 모양은 `blobs.css`에 모은다. 정확한 곡선까지 똑같을 필요는 없지만, **"한눈에 같은 종류의 모양"으로 보여야** 한다.

### 공통 카드 스타일 (`.card`)
- `position: relative;` (장식 배치 기준)
- 안쪽 여백: 위아래 `32px`, 좌우 `24px`
- 글씨색 `var(--ink)`, 가운데 정렬
- 최소 높이 `150px`

### 카드 1 — 노랑 구름 (`.card--yellow`)
- 배경 `--yellow`
- **양쪽 끝이 물결치는 구름 모양**: 큰 둥근 모서리(`border-radius: 48px`) + 좌우 가장자리에 반원 돌기 4개.
- 구현 권장: `::before`, `::after`에 같은 색 원 2개씩(지름 약 56px)을 좌/우 가장자리에 걸쳐 배치. 또는 `radial-gradient`를 이용한 마스크.
- 해바라기 스티커: 카드 **오른쪽 아래 모서리**에 절반 걸쳐 배치(`.sticker--hero`, 약 64px).

### 카드 2 — 보라 물방울 (`.card--purple`)
- 배경 `--purple`, 위쪽 모서리 둥글게(`border-radius: 40px 40px 28px 28px`)
- **아래쪽에서 6~8개의 물방울이 늘어진 모양**: 같은 보라색의 세로 막대(너비 14~22px, 높이 20~50px, 아래 끝은 둥글게)를 카드 아래 가장자리에 불규칙한 간격·높이로 붙인다.
- 구현 권장: `.drips` 요소 안에 `<i>` 7개를 두고 각각 `height`, `left`를 다르게 지정. (장식이므로 `aria-hidden="true"`)
- **흰 눈알**: 카드 오른쪽 위 구석에 흰색 타원(약 24×16px) + 검정 동공. 입력창에 포커스가 가면 동공이 입력창 쪽(아래)을 바라보도록 살짝 이동(선택 사항이 아닌 **생략 가능**; 만들 경우 모션 줄이기 설정을 지킨다).
- 입력창(`textarea`): 배경 `--paper`, 글씨 `--ink`, `border: 4px solid var(--ink)`, `border-radius: 24px`, 안쪽 여백 `14px`, 너비 100%, 세로 크기 조절 불가(`resize: none`).
- 글자 수 표시: 오른쪽 정렬, 작은 글씨. 500자를 넘으면 `--error` 대신 **진한 검정 + 굵게**로 표시(보라 배경 위 대비 확보).

### 카드 3 — 분홍 머그컵 (`.card--pink`)
- 배경 `--pink`, `border-radius: 20px`
- **양옆 머그 손잡이**: 카드 좌우 바깥쪽에 분홍색 테두리 고리(너비 40px, 높이 약 70px, 두께 10px, 가운데는 검정 배경이 비침)를 세로 중앙에 배치. `::before`(왼쪽), `::after`(오른쪽).
- **위쪽 흰 크림 흐름**: 카드 위쪽 가장자리에 흰색 세로 막대 3개(너비 14px, 높이 20~36px, 아래 끝 둥글게)를 붙인다.
- 해바라기 스티커(`.sticker--result`): 카드 **오른쪽 위 모서리**에 걸쳐 배치, 크기 약 72px.
- 결과 단어(`#result-label`)는 `--fs-result` 크기, `--font-display`.

### 카드 4 — 주황 리본 (`.card--orange`)
- 배경 `--orange`
- **출렁이는 불규칙한 모양**: `border-radius: 58% 42% 48% 52% / 22% 28% 24% 26%` 같은 비대칭 값 사용. (값은 자유 조정 가능, 단 직사각형처럼 보이면 안 됨)
- **흰 X 리본**: 흰색 가는 막대(너비 8px) 4개를 사선(약 ±20°)으로 회전해 카드 **왼쪽 끝**과 **오른쪽 끝**에 각각 X 모양으로 배치. 텍스트 위를 가리지 않게 가장자리 18% 영역에만 둔다. (`aria-hidden`)
- 신뢰도 막대(`.meter__track`): 배경 `rgba(17,17,17,0.25)`, 높이 18px, 둥근 끝, 채움(`.meter__fill`)은 `--paper` 흰색. 채워지는 너비는 `style.width = confidence + "%"`.
- 신뢰도 숫자(`.meter__text`): `--font-display`, 1.6rem.
- 이유 문장(`.reason`): `--font-body`, 1rem, `line-height: 1.6`, 한 줄 길이 `max-width: 28em`.

### 카드 5 — 청록 구름 (`.card--teal`)
- 카드 1과 같은 구름 모양 규칙 사용. 배경 `--teal`.
- 해바라기 스티커 장식은 **없음** (카드 1, 3에만 존재).
- 본문 글씨는 `--font-body` 0.9rem, 가운데 정렬, `max-width: 30em`.

---

## 6. 해바라기 표정 스티커 (`public/assets/faces.svg`)

- 직접 그린 SVG **심볼 3개**를 `id`로 구분: `face-positive`, `face-negative`, `face-neutral`.
- 공통 구성: 노란 꽃잎 원형(`--sun` 색, 둥근 꽃잎 12개 정도) + 분홍 얼굴 원(`--pink` 색) + 검정 테두리.
- 표정:
  | id | 눈 | 입 |
  |---|---|---|
  | `face-positive` | 반달 모양 웃는 눈(`^ ^`) | 활짝 웃는 입 |
  | `face-negative` | 아래로 처진 눈 | 아래로 굽은 입 |
  | `face-neutral` | 가는 가로 줄 눈 | 일직선 입 |
- 결과가 나오면 `#result-sticker`의 `<use href>`를 해당 id로 바꾼다. (예: `/assets/faces.svg#face-negative`)
- 처음 상태(결과 없음)는 `face-neutral`.
- **참고 이미지의 해바라기 그림을 그대로 베끼지 않는다.** 같은 콘셉트(꽃잎 + 얼굴)로 새로 그린다.
- SVG가 복잡하면 `<symbol viewBox="0 0 100 100">` 안에 도형 `circle`, `path` 몇 개로 단순하게 만든다.

---

## 7. 버튼과 입력 요소

### 분석하기 버튼 (`.btn`)
- 배경 `--yellow`, 글씨 `--ink`, `border: 4px solid var(--ink)`, `border-radius: var(--radius-ui)`
- 글꼴 `--font-display`, 크기 1.4rem, 안쪽 여백 `12px 36px`, 최소 높이 `52px`(터치하기 편한 크기)
- 마우스 올림(hover): 살짝 위로 `translateY(-2px)` + 오른쪽 아래 `4px 4px 0 var(--ink)` 그림자
- 눌림(active): 원위치 + 그림자 제거
- **키보드 포커스(`:focus-visible`)**: `outline: 4px solid var(--paper); outline-offset: 3px;` — 반드시 보여야 함
- 로딩 중(`disabled`): 불투명도 0.6, `cursor: not-allowed`, 글씨는 "분석 중..."

### 상태별 화면 (아래 5가지를 **모두** 구현)

| 상태 | 카드 3 (분홍) | 카드 4 (주황) | 버튼 |
|---|---|---|---|
| ① 처음 | "결과" + 안내 문구 + 무표정 스티커 | 안내 문구만, 신뢰도 막대 숨김 | "분석하기" |
| ② 분석 중 | "분석 중이에요..." + 스티커 흔들림 | 이전 결과 지움 | "분석 중..." (비활성) |
| ③ 성공 | 결과 단어 + 해당 표정 스티커 | 신뢰도 숫자·막대 + 이유 | "분석하기" |
| ④ 입력 오류 | 변화 없음 | 변화 없음 | 보라 카드 안 `#input-error`에 메시지 |
| ⑤ 서버/네트워크 오류 | `#server-error`에 메시지, 결과 단어 숨김 | 이전 결과 지움 | "분석하기" |

- **오류 메시지 스타일**: 배경이 컬러 카드라서 빨간 글씨는 잘 안 보인다. → 메시지는 **검정 배경(`--ink`) + 흰 글씨 + 왼쪽에 `!` 아이콘(텍스트)**을 가진 둥근 알약(pill) 박스로 표시한다. 글씨 크기 `--fs-small` 이상(14px 권장).
- 오류 메시지 문구는 `docs/03-feature-spec.md`의 표를 그대로 사용한다.

---

## 8. 모션(움직임) 규칙

사용하는 모션은 아래 **3가지뿐**이다. 그 외 모션(페이지 진입 애니메이션, 모든 카드 hover 효과 등)은 추가하지 않는다.

1. 분석 중 해바라기 스티커 좌우 흔들림 (`@keyframes wiggle`, 0.6s 반복)
2. 결과 도착 시 결과 단어가 한 번 "톡" 커지는 효과 (`scale 0.9 → 1`, 0.25s)
3. 신뢰도 막대가 0%에서 목표값까지 채워지는 효과 (`transition: width 0.6s ease`)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```
→ 위 규칙이 반드시 `base.css`에 있어야 한다. (움직임 줄이기 설정을 켠 사람을 위한 배려)

---

## 9. 반응형 기준

| 화면 너비 | 동작 |
|---|---|
| 360px ~ 479px | 기본 레이아웃. 카드 좌우 여백 12px |
| 480px ~ 767px | 카드 큰 제목 크기 최대치 유지, 콘텐츠 가운데 정렬 |
| 768px 이상 | `--page-max` 560px로 가운데 정렬, 양옆 검정 |

- 머그 손잡이·물방울 등 **바깥으로 튀어나오는 장식**은 좁은 화면에서 잘리지 않도록 카드 좌우에 최소 `28px` 바깥 여백을 확보한다. (`.page { padding-inline: 28px }` 등)
- 글자가 카드 밖으로 넘치지 않는다. 긴 단어는 `overflow-wrap: anywhere`.

---

## 10. 접근성 체크 (UI 완료기준에 포함)

- [ ] 글씨(진한 검정)와 카드 배경(노랑·보라·분홍·주황·청록)의 대비가 충분하다. (보라 배경 위에서도 검정 글씨 크기 16px 이상, 또는 큰 제목만 사용)
- [ ] Tab 키로 `입력창 → 분석하기 버튼` 순서로 이동되고, 포커스 표시가 보인다
- [ ] 결과 영역(`#result-area`)이 `aria-live="polite"`라서 결과 변경이 스크린리더에 읽힌다
- [ ] 입력 오류(`#input-error`), 서버 오류(`#server-error`)는 `role="alert"`
- [ ] 장식 요소(스티커, 물방울, 리본, 눈알)는 `aria-hidden="true"`
- [ ] 이미지가 아닌 정보(결과 단어, 신뢰도 숫자)는 **텍스트로** 존재한다 (색이나 그림에만 의존하지 않음)

---

## 11. UI 단계 검증 방법

에이전트는 UI 구현 후 아래를 **실제로 확인**하고 보고한다.

1. `vercel dev` 실행 → `http://localhost:3000` 접속
2. 브라우저 개발자도구 → 모바일 보기(360×740)와 데스크톱(1280px) 모두에서 5개 카드가 **노랑→보라→분홍→주황→청록** 순서로 보인다
3. 가로 스크롤바가 없다
4. 상태 5종(처음/분석 중/성공/입력 오류/서버 오류)을 **가짜 데이터로 강제로** 띄워서 확인한다 (예: `ui.js`의 함수를 콘솔에서 직접 호출)
5. 가능하면 360px 화면 스크린샷을 찍어 사용자에게 보여준다
6. 참고 이미지와 비교해 사용자가 "분위기가 같다"고 확인할 수 있게 **차이가 나는 부분을 정직하게 알린다**

### UI 완료기준
- [ ] 5개 카드의 색·순서·고유 모양(구름/물방울/머그/리본/구름)이 구현됨
- [ ] 상태 5종이 모두 올바르게 표시됨
- [ ] 360px에서 가로 스크롤 없음
- [ ] 접근성 체크(10번) 모두 통과
- [ ] 외부 이미지 파일(png/jpg) 없이 CSS/SVG만 사용
- [ ] 참고 이미지의 폰트·그림 파일을 사용하지 않음
