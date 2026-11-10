// public/js/api.js
// 목적: 백엔드 서버(/api/analyze)와 비동기 통신을 전담하며, 화면(DOM)은 일체 건드리지 않습니다.

import { API_URL, REQUEST_TIMEOUT_MS } from "./config.js";

/**
 * API 호출 전용 커스텀 에러 클래스
 */
export class ApiError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = "ApiError";
    this.code = code;
  }
}

/**
 * 서버에 텍스트 감성 분석을 요청하는 함수
 * @param {string} text - 분석할 문장
 * @returns {Promise<{ sentiment: string, confidence: number, reason: string }>}
 */
export async function analyzeText(text) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 응답 본문 파싱 시도
    let data;
    try {
      data = await response.json();
    } catch {
      throw new ApiError("BAD_RESPONSE", "Server returned non-JSON response");
    }

    // 서버가 에러 상태코드(4xx, 5xx)를 반환한 경우
    if (!response.ok) {
      const code = data?.error?.code || "DEFAULT";
      const message = data?.error?.message || "Server error";
      throw new ApiError(code, message);
    }

    // 성공 응답 반환
    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    // 이미 ApiError로 변환된 경우 그대로 전파
    if (err instanceof ApiError) {
      throw err;
    }

    // 요청 시간 초과(AbortError)
    if (err.name === "AbortError") {
      throw new ApiError("TIMEOUT", "Request timeout");
    }

    // 네트워크 끊김 등 fetch 연결 실패
    throw new ApiError("NETWORK_ERROR", err.message);
  }
}

