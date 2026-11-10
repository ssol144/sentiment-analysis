// public/js/main.js
// 목적: 화면 엘리먼트와 이벤트를 바인딩하고 전체 서비스의 제어 흐름을 관리합니다.

import { MAX_LENGTH, ERROR_MESSAGES } from "./config.js";
import { analyzeText } from "./api.js";
import {
  showIdle,
  showLoading,
  showResult,
  showInputError,
  showServerError,
  clearErrors,
  updateCharCount,
} from "./ui.js";

// 현재 요청 진행 중 여부 플래그 (중복 제출 방지)
let isLoading = false;

// DOM 엘리먼트 획득
const analyzeForm = document.getElementById("analyze-form");
const textInput = document.getElementById("text-input");

/**
 * 폼 제출 이벤트 핸들러
 */
async function handleSubmit(event) {
  event.preventDefault();

  // 이미 분석 중인 경우 중복 클릭 방지
  if (isLoading) return;

  const rawValue = textInput ? textInput.value : "";
  const trimmedText = rawValue.trim();

  // 1. 브라우저 단 1차 입력 검증
  if (trimmedText.length === 0) {
    showInputError(ERROR_MESSAGES.EMPTY_TEXT);
    return;
  }

  if (trimmedText.length > MAX_LENGTH) {
    showInputError(ERROR_MESSAGES.TEXT_TOO_LONG);
    return;
  }

  // 2. 로딩 상태 시작
  isLoading = true;
  clearErrors();
  showLoading();

  try {
    // 3. 서버 API 호출
    const result = await analyzeText(trimmedText);

    // 4. 결과 성공 표시 (입력창 텍스트는 지우지 않고 유지)
    showResult(result);
  } catch (err) {
    // 5. 에러 처리: 코드에 맞는 친절한 한국어 안내 문구 매핑
    const errorMsg = ERROR_MESSAGES[err.code] || ERROR_MESSAGES.DEFAULT;

    if (err.code === "EMPTY_TEXT" || err.code === "TEXT_TOO_LONG") {
      showInputError(errorMsg);
    } else {
      showServerError(errorMsg);
    }
  } finally {
    // 6. 로딩 상태 해제
    isLoading = false;
  }
}

// 초기화 및 이벤트 리스너 등록
window.addEventListener("DOMContentLoaded", () => {
  // 화면을 초기 상태로 세팅
  showIdle();
  updateCharCount(0);

  // 실시간 글자 수 카운팅 및 입력 시 에러 알약 숨김
  if (textInput) {
    textInput.addEventListener("input", () => {
      clearErrors();
      updateCharCount(textInput.value.length);
    });
  }

  // 폼 제출 이벤트 바인딩
  if (analyzeForm) {
    analyzeForm.addEventListener("submit", handleSubmit);
  }
});

