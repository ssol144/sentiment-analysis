// lib/supabase.js
// 목적: 감성 분석 결과를 Supabase 데이터베이스에 안전하게 기록합니다.
// 규칙: 저장이 실패하더라도 사용자 분석 결과에는 영향을 주지 않습니다.

import { createClient } from "@supabase/supabase-js";

let client = null; // 재사용을 위한 클라이언트 싱글톤 인스턴스

/**
 * Supabase 서비스 롤 클라이언트를 초기화하여 반환합니다.
 */
function getClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase 환경변수(SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)가 설정되지 않았습니다.");
  }

  client = createClient(url, key, {
    auth: {
      persistSession: false,
    },
  });

  return client;
}

/**
 * 분석 완료된 감성 데이터를 테이블에 저장합니다.
 * @param {object} params
 * @param {string} params.text - 사용자가 입력한 문장
 * @param {string} params.sentiment - 감성 결과 (positive/negative/neutral)
 * @param {number} params.confidence - 신뢰도 (0~100)
 * @param {string} params.reason - 분석 이유
 * @param {string} params.model - 사용된 AI 모델 명칭
 */
export async function saveAnalysis({ text, sentiment, confidence, reason, model }) {
  // DB 저장이 너무 지연되어 사용자 응답이 늦어지지 않도록 최대 5초 타임아웃 적용
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Supabase 저장 시간 초과 (5초)")), 5000)
  );

  const savePromise = (async () => {
    const supabase = getClient();
    const { error } = await supabase.from("sentiment_analyses").insert({
      input_text: text,
      sentiment,
      confidence,
      reason,
      model: model || null,
    });

    if (error) {
      throw new Error(`Supabase insert 에러: ${error.message}`);
    }
  })();

  await Promise.race([savePromise, timeoutPromise]);
}

