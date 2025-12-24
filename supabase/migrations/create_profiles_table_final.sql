-- profiles 테이블이 이미 존재한다면 먼저 삭제 (CASCADE로 의존성 제거)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS generate_user_code(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS generate_user_code() CASCADE;

-- unique_code 생성 함수 (8자리 랜덤 코드)
CREATE OR REPLACE FUNCTION generate_user_code(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- user_groups 테이블이 없으면 생성 (profiles가 참조하므로 먼저 필요)
CREATE TABLE IF NOT EXISTS public.user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- profiles 테이블 생성 (온보딩 정보 포함)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 기본 정보
  email TEXT,
  nickname TEXT,
  full_name TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  bio TEXT,
  
  -- 온보딩 정보
  gender TEXT CHECK (gender IN ('male', 'female', 'none')),
  phone TEXT CHECK (char_length(COALESCE(phone, '')) <= 32),
  birthdate DATE,
  
  -- 주소 정보
  address1 TEXT,
  address2 TEXT,
  zip_code TEXT CHECK (zip_code ~ '^[0-9]{5}$' OR zip_code IS NULL),
  
  -- 온보딩 상태
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  
  -- 마케팅 동의
  marketing_consent BOOLEAN,
  marketing_consent_at TIMESTAMPTZ,
  
  -- 회원 정보
  member_type TEXT NOT NULL DEFAULT 'consumer' CHECK (member_type IN ('consumer', 'expert', 'business')),
  unique_code TEXT UNIQUE NOT NULL DEFAULT generate_user_code(8),
  pass_tier TEXT,
  group_id UUID REFERENCES public.user_groups(id) ON DELETE SET NULL,
  admin_access BOOLEAN NOT NULL DEFAULT false,
  
  -- 포인트 및 점수
  tier_score BIGINT NOT NULL DEFAULT 0,
  reward_points BIGINT NOT NULL DEFAULT 0,
  
  -- 기타
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 닉네임 유니크 인덱스 (중복 확인용)
CREATE UNIQUE INDEX profiles_nickname_unique_idx 
ON public.profiles(nickname) 
WHERE nickname IS NOT NULL;

-- 이메일 인덱스
CREATE INDEX profiles_email_idx 
ON public.profiles(email) 
WHERE email IS NOT NULL;

-- unique_code 인덱스 (이미 UNIQUE 제약조건이 있지만 성능을 위해)
CREATE INDEX profiles_unique_code_idx 
ON public.profiles(unique_code);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 프로필을 읽을 수 있음
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- RLS 정책: 사용자는 자신의 프로필을 업데이트할 수 있음
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS 정책: 사용자는 자신의 프로필을 삽입할 수 있음
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS 정책: 모든 사용자는 다른 사용자의 닉네임을 확인할 수 있음 (중복 확인용)
DROP POLICY IF EXISTS "Anyone can check nickname availability" ON public.profiles;
CREATE POLICY "Anyone can check nickname availability"
  ON public.profiles
  FOR SELECT
  USING (true);

COMMENT ON TABLE public.profiles IS '사용자 프로필 정보 테이블';
COMMENT ON COLUMN public.profiles.id IS '사용자 ID (auth.users와 연결)';
COMMENT ON COLUMN public.profiles.nickname IS '닉네임 (유니크)';
COMMENT ON COLUMN public.profiles.full_name IS '실명';
COMMENT ON COLUMN public.profiles.gender IS '성별 (male/female/none)';
COMMENT ON COLUMN public.profiles.phone IS '휴대전화번호';
COMMENT ON COLUMN public.profiles.address1 IS '주소';
COMMENT ON COLUMN public.profiles.avatar_url IS '프로필 이미지 URL';
COMMENT ON COLUMN public.profiles.onboarding_completed IS '온보딩 완료 여부';
COMMENT ON COLUMN public.profiles.onboarding_completed_at IS '온보딩 완료 시간';

