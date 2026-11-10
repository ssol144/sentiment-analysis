// lib/errors.js
// 목적: 서비스 전체에서 사용할 커스텀 에러 클래스와 에러 응답 헬퍼 함수를 정의합니다.

/**
 * 애플리케이션 공통 에러 클래스
 * @param {string} code - 사전에 정의된 표준 에러 코드 (예: EMPTY_TEXT, RATE_LIMIT)
 * @param {number} status - HTTP 상태 코드 (예: 400, 500)
 * @param {string} [message] - 내부 개발자용 설명 (클라이언트 화면에는 노출되지 않음)
 */
export class AppError extends Error {
  constructor(code, status = 500, message = "") {
    super(message || code);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

/**
 * 에러를 받아 클라이언트(브라우저)에게 일관된 JSON 형식으로 응답하는 함수
 * @param {object} res - 서버리스 함수의 응답 객체
 * @param {Error|AppError} err - 발생한 에러 객체
 */
export function sendError(res, err) {
  // AppError 인스턴스인 경우 미리 지정된 코드와 상태 코드를 사용
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message || err.code,
      },
    });
  }

  // 예측하지 못한 시스템 에러의 경우 서버 콘솔에만 기록하고
  // 민감한 정보(스택 트레이스, 키 등)가 클라이언트에 노출되지 않도록 표준 SERVER_ERROR로 응답
  console.error("예측하지 못한 서버 에러 발생:", err.message);
  return res.status(500).json({
    error: {
      code: "SERVER_ERROR",
      message: "An internal server error occurred.",
    },
  });
}

