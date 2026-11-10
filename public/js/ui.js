// public/js/ui.js
// 목적: 화면(DOM) 업데이트와 5가지 상태(초기, 로딩, 성공, 입력에러, 서버에러)를 전담합니다.
// 보안 규칙: 사용자 입력 및 AI 응답은 반드시 textContent를 사용하여 XSS 공격을 방지합니다.

import { SENTIMENT_LABELS, FACE_IDS, MAX_LENGTH } from "./config.js";

// DOM 주요 엘리먼트 참조 캐싱
const submitBtn = document.getElementById("submit-btn");
const charCount = document.getElementById("char-count");
const inputError = document.getElementById("input-error");
const serverError = document.getElementById("server-error");
const resultArea = document.getElementById("result-area");
const resultStickerUse = document.querySelector("#result-sticker use");
const resultStickerSvg = document.getElementById("result-sticker");
const meterArea = document.getElementById("meter");
const confidenceText = document.getElementById("confidence-text");
const confidenceBar = document.getElementById("confidence-bar");
const reasonText = document.getElementById("reason-text");
const progressBarTrack = document.querySelector(".meter__track");

/**
 * 에러 메시지 알약들을 모두 숨깁니다.
 */
export function clearErrors() {
  if (inputError) {
    inputError.hidden = true;
    inputError.textContent = "";
  }
  if (serverError) {
    serverError.hidden = true;
    serverError.textContent = "";
  }
}

/**
 * 입력창 아래 현재 글자 수를 갱신합니다.
 * @param {number} length - 입력된 글자 수
 */
export function updateCharCount(length) {
  if (!charCount) return;
  charCount.textContent = `${length} / ${MAX_LENGTH}`;

  if (length > MAX_LENGTH) {
    charCount.classList.add("char-count--exceeded");
  } else {
    charCount.classList.remove("char-count--exceeded");
  }
}

/**
 * ① 초기 상태: 아무런 분석 결과가 없는 기본 화면 상태로 초기화합니다.
 */
export function showIdle() {
  clearErrors();

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "분석하기";
  }

  // 결과 카드 초기화
  if (resultArea) {
    resultArea.replaceChildren();
    const placeholder = document.createElement("p");
    placeholder.id = "result-placeholder";
    placeholder.className = "card__title";
    placeholder.textContent = "*결과!&";

    const caption = document.createElement("p");
    caption.id = "result-caption";
    caption.className = "card__caption";
    caption.textContent = "문장을 입력하면 여기에 결과가 나와요.";

    resultArea.appendChild(placeholder);
    resultArea.appendChild(caption);
  }

  // 스티커 중립 표정으로 복원 및 흔들림 제거
  if (resultStickerUse) {
    resultStickerUse.setAttribute("href", `/assets/faces.svg#${FACE_IDS.neutral}`);
  }
  if (resultStickerSvg) {
    resultStickerSvg.classList.remove("sticker--wiggle");
  }

  // 신뢰도 미터 숨김 및 이유 텍스트 초기화
  if (meterArea) meterArea.hidden = true;
  if (confidenceBar) confidenceBar.style.width = "0%";
  if (reasonText) {
    reasonText.textContent = "분석 결과가 나오면 신뢰도와 이유를 알려드려요.";
  }
}

/**
 * ② 로딩 상태: 분석 중 화면을 표시하고 버튼을 비활성화합니다.
 */
export function showLoading() {
  clearErrors();

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "분석 중...";
  }

  // 결과 카드에 로딩 문구 표시
  if (resultArea) {
    resultArea.replaceChildren();
    const loadingTitle = document.createElement("p");
    loadingTitle.className = "card__title";
    loadingTitle.textContent = "분석 중이에요...";
    resultArea.appendChild(loadingTitle);
  }

  // 스티커 흔들림 효과 적용
  if (resultStickerSvg) {
    resultStickerSvg.classList.add("sticker--wiggle");
  }

  // 신뢰도 영역 숨김
  if (meterArea) meterArea.hidden = true;
  if (reasonText) reasonText.textContent = "";
}

/**
 * ③ 성공 상태: AI 분석 결과(긍정/부정/중립, 신뢰도 %, 판단 이유)를 화면에 표시합니다.
 * @param {{ sentiment: string, confidence: number, reason: string }} result
 */
export function showResult(result) {
  clearErrors();

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "분석하기";
  }

  if (resultStickerSvg) {
    resultStickerSvg.classList.remove("sticker--wiggle");
  }

  const sentiment = result?.sentiment;
  const confidence = Number(result?.confidence);
  const reason = result?.reason;

  // 허용되지 않은 감성 결과값이 온 경우 에러 처리
  if (!SENTIMENT_LABELS[sentiment]) {
    showServerError("AI 응답을 이해하지 못했어요. 다시 시도해주세요.");
    return;
  }

  // 1. 결과 단어 표시 (textContent로 안전하게 삽입)
  if (resultArea) {
    resultArea.replaceChildren();
    const resultLabel = document.createElement("p");
    resultLabel.id = "result-label";
    resultLabel.className = "card__title result-label";
    resultLabel.textContent = SENTIMENT_LABELS[sentiment];
    resultArea.appendChild(resultLabel);
  }

  // 2. 표정 스티커 변경
  if (resultStickerUse) {
    resultStickerUse.setAttribute("href", `/assets/faces.svg#${FACE_IDS[sentiment]}`);
  }

  // 3. 신뢰도 숫자 및 프로그레스 바 표시
  const safeConfidence = Math.min(100, Math.max(0, isNaN(confidence) ? 0 : confidence));
  if (confidenceText) {
    confidenceText.textContent = `신뢰도 ${safeConfidence}%`;
  }
  if (confidenceBar) {
    confidenceBar.style.width = `${safeConfidence}%`;
  }
  if (progressBarTrack) {
    progressBarTrack.setAttribute("aria-valuenow", String(safeConfidence));
  }
  if (meterArea) {
    meterArea.hidden = false;
  }

  // 4. 분석 이유 표시
  if (reasonText) {
    reasonText.textContent = typeof reason === "string" ? reason : "";
  }
}

/**
 * ④ 입력 에러 상태: 입력창 아래 오류 알약을 표시합니다.
 * @param {string} message
 */
export function showInputError(message) {
  if (inputError) {
    inputError.textContent = message;
    inputError.hidden = false;
  }
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "분석하기";
  }
  if (resultStickerSvg) {
    resultStickerSvg.classList.remove("sticker--wiggle");
  }
}

/**
 * ⑤ 서버/네트워크 에러 상태: 결과 카드 내부의 오류 알약을 표시합니다.
 * @param {string} message
 */
export function showServerError(message) {
  if (serverError) {
    serverError.textContent = message;
    serverError.hidden = false;
  }
  if (resultArea) {
    resultArea.replaceChildren();
  }
  if (meterArea) {
    meterArea.hidden = true;
  }
  if (reasonText) {
    reasonText.textContent = "";
  }
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "분석하기";
  }
  if (resultStickerSvg) {
    resultStickerSvg.classList.remove("sticker--wiggle");
  }
}

