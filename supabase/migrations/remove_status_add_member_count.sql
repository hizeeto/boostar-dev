-- ============================================
-- 프로젝트 상태 제거 및 참여 인원 추가 마이그레이션
-- ============================================

-- 1. status 컬럼 제거
-- 먼저 CHECK 제약조건 제거
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- status 인덱스 제거
DROP INDEX IF EXISTS public.projects_status_idx;

-- status 컬럼 제거
ALTER TABLE public.projects DROP COLUMN IF EXISTS status;

-- 2. 참여 인원 컬럼 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'member_count'
  ) THEN
    -- 먼저 NULL 허용으로 컬럼 추가
    ALTER TABLE public.projects ADD COLUMN member_count INTEGER;
    -- 기존 데이터에 기본값 1 설정
    UPDATE public.projects SET member_count = 1 WHERE member_count IS NULL;
    -- NOT NULL 제약조건 추가
    ALTER TABLE public.projects ALTER COLUMN member_count SET NOT NULL;
    -- 기본값 설정
    ALTER TABLE public.projects ALTER COLUMN member_count SET DEFAULT 1;
  END IF;
END $$;

-- member_count 코멘트 추가
COMMENT ON COLUMN public.projects.member_count IS '프로젝트 참여 인원 수 (소유자 포함)';

-- status 관련 코멘트 제거 (컬럼이 없으므로 자동으로 제거됨)

