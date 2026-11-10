-- ==============================================================================
-- 001_create_sentiment_analyses_table.sql
-- 목적: 감성 분석 결과를 저장하기 위한 Supabase 테이블 생성 및 보안(RLS) 설정
-- ==============================================================================

-- 1. 감성 분석 기록 테이블 생성
-- 사용자가 입력한 문장, AI 분석 결과(긍정/부정/중립), 신뢰도(%), 분석 이유를 저장합니다.
create table if not exists public.sentiment_analyses (
  -- 고유 식별자 (자동 생성되는 UUID)
  id          uuid primary key default gen_random_uuid(),

  -- 사용자가 입력한 문장 (앞뒤 공백 제거 후 1자 이상 500자 이하만 허용)
  input_text  text        not null check (char_length(input_text) between 1 and 500),

  -- AI 분석 결과 ('positive': 긍정, 'negative': 부정, 'neutral': 중립 3가지만 허용)
  sentiment   text        not null check (sentiment in ('positive', 'negative', 'neutral')),

  -- 확신 정도를 나타내는 신뢰도 (0% ~ 100% 사이의 정수)
  confidence  smallint    not null check (confidence between 0 and 100),

  -- AI가 생성한 분석 판단 이유 (한국어 설명)
  reason      text        not null,

  -- 사용된 AI 모델 명칭 (예: gpt-4o-mini)
  model       text,

  -- 데이터가 저장된 일시 (기본값: 현재 시간)
  created_at  timestamptz not null default now()
);

-- 2. 최신순 조회를 대비한 인덱스(색인) 생성
-- 데이터가 많아져도 시간 순으로 빠르게 조회할 수 있도록 도와줍니다.
create index if not exists sentiment_analyses_created_at_idx
  on public.sentiment_analyses (created_at desc);

-- 3. 행 단위 보안(Row Level Security, RLS) 활성화
-- 웹 브라우저(익명 사용자 anon)가 이 테이블의 데이터를 직접 읽거나 수정하지 못하도록 막습니다.
-- 정책(Policy)을 추가하지 않았으므로, 비밀 키(service_role)를 가진 백엔드 서버에서만 안전하게 저장할 수 있습니다.
alter table public.sentiment_analyses enable row level security;

