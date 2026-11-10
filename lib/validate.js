// lib/validate.js
// 목적: 클라이언트에서 전달된 요청 데이터의 유효성을 검사합니다.

import { AppError } from "./errors.js";

/**
 * 사용자 입력 텍스트 검증 함수
 * @param {object} body - 요청 본문 객체 (예: { text: "..." })
 * @returns {string} - 앞뒤 공백이 제거된 정리된 텍스트
 */
export function validateText(body) {
  // body가 없거나 text 필드가 문자열이 아닌 경우
  if (!body || typeof body.text !== "string") {
    throw new AppError("EMPTY_TEXT", 400, "text is required and must be a string");
  }

  const trimmedText = body.text.trim();

  // 공백 제거 후 내용이 비어 있는 경우
  if (trimmedText.length === 0) {
    throw new AppError("EMPTY_TEXT", 400, "text cannot be empty");
  }

  // 500자를 초과하는 경우
  if (trimmedText.length > 500) {
    throw new AppError("TEXT_TOO_LONG", 400, "text must be 500 characters or less");
  }

  return trimmedText;
}

