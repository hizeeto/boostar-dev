-- ============================================
-- 프로젝트 바로가기 고정 기능 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- is_pinned 컬럼 추가 (기본값: false)
DO $$ 
BEGIN
  -- is_pinned 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'is_pinned'
  ) THEN
    -- 컬럼 추가 (기본값: false = 고정되지 않음)
    ALTER TABLE public.projects 
    ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false;
    
    RAISE NOTICE 'is_pinned 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'is_pinned 컬럼이 이미 존재합니다.';
    -- 기존 컬럼의 기본값을 false로 설정
    ALTER TABLE public.projects 
    ALTER COLUMN is_pinned SET DEFAULT false;
    
    RAISE NOTICE 'is_pinned 컬럼의 기본값을 false로 설정했습니다.';
  END IF;
END $$;

-- 인덱스 생성 (고정된 프로젝트 필터링 성능 향상)
CREATE INDEX IF NOT EXISTS projects_is_pinned_idx 
ON public.projects(is_pinned);

-- 기존 데이터 확인 및 업데이트 (NULL이면 false로 설정)
DO $$
BEGIN
  UPDATE public.projects 
  SET is_pinned = false 
  WHERE is_pinned IS NULL;
  
  IF FOUND THEN
    RAISE NOTICE '기존 프로젝트의 is_pinned 값을 false로 설정했습니다.';
  END IF;
END $$;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.projects.is_pinned IS '프로젝트 바로가기 고정 여부 (false: 고정 안 됨, true: 고정됨)';

