// api/analyze.js
// 목적: Vercel 서버리스 함수로 동작하는 감성 분석 엔드포인트 (POST /api/analyze)

import { validateText } from "../lib/validate.js";
import { analyzeSentiment } from "../lib/openai.js";
import { saveAnalysis } from "../lib/supabase.js";
import { AppError, sendError } from "../lib/errors.js";

export default async function handler(req, res) {
  try {
    // 1. HTTP 메서드 확인 (POST만 허용)
    if (req.method !== "POST") {
      throw new AppError("METHOD_NOT_ALLOWED", 405, "Only POST method is allowed");
    }

    // 2. 필수 환경변수 사전 점검
    if (!process.env.OPENAI_API_KEY) {
      console.error("환경변수 누락: OPENAI_API_KEY가 설정되지 않았습니다.");
      throw new AppError("SERVER_CONFIG_ERROR", 500, "Missing OPENAI_API_KEY");
    }

    // 3. 클라이언트 요청 본문 입력 검증
    const text = validateText(req.body);

    // 4. OpenAI API 감성 분석 수행
    const result = await analyzeSentiment(text);

    // 5. Supabase DB 저장 (저장 실패 시 콘솔에만 기록하고 클라이언트 응답은 정상 진행)
    await saveAnalysis({
      text,
      sentiment: result.sentiment,
      confidence: result.confidence,
      reason: result.reason,
      model: result.model,
    }).catch((dbErr) => {
      console.error("DB 저장 실패 (사용자 응답은 계속 진행):", dbErr.message);
    });

    // 6. 브라우저로 필요한 3가지 데이터만 성공 응답 (200 OK)
    return res.status(200).json({
      sentiment: result.sentiment,
      confidence: result.confidence,
      reason: result.reason,
    });
  } catch (err) {
    // 7. 에러 응답 처리
    return sendError(res, err);
  }
}

