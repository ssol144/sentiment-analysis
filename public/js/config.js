// public/js/config.js
// 목적: 클라이언트 전체에서 사용하는 상수 및 설정값을 정의합니다.

export const APP_NAME = "마음 온도계";
export const MAX_LENGTH = 500;
export const REQUEST_TIMEOUT_MS = 25000; // 브라우저 대기 시간 한도 (25초)
export const API_URL = "/api/analyze";

// 감성 분석 결과 한글 레이블
export const SENTIMENT_LABELS = {
  positive: "긍정",
  negative: "부정",
  neutral:  "중립",
};

// 해바라기 표정 스티커 심볼 ID
export const FACE_IDS = {
  positive: "face-positive",
  negative: "face-negative",
  neutral:  "face-neutral",
};

// 에러 코드별 사용자 친화적 한국어 안내 문구 매핑 (docs/03-feature-spec.md 표 준수)
export const ERROR_MESSAGES = {
  EMPTY_TEXT: "문장을 입력해주세요.",
  TEXT_TOO_LONG: "500자 이하로 입력해주세요.",
  NETWORK_ERROR: "인터넷 연결을 확인하고 다시 시도해주세요.",
  TIMEOUT: "응답이 너무 오래 걸려요. 잠시 후 다시 시도해주세요.",
  RATE_LIMIT: "요청이 많아요. 잠시 후 다시 시도해주세요.",
  OPENAI_ERROR: "AI 분석 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.",
  INVALID_AI_RESPONSE: "AI 응답을 이해하지 못했어요. 다시 시도해주세요.",
  SERVER_CONFIG_ERROR: "서비스 설정에 문제가 있어요. 관리자에게 문의해주세요.",
  METHOD_NOT_ALLOWED: "잘못된 요청이에요. 페이지를 새로고침해주세요.",
  BAD_RESPONSE: "서버 응답을 읽지 못했어요. 다시 시도해주세요.",
  DEFAULT: "알 수 없는 오류가 생겼어요. 잠시 후 다시 시도해주세요.",
};

