-- ============================================
-- 프로젝트 색상 필드 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- color 컬럼 추가 (기본값: purple)
DO $$ 
BEGIN
  -- color 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'color'
  ) THEN
    -- 컬럼 추가 (기본값: purple)
    ALTER TABLE public.projects 
    ADD COLUMN color TEXT NOT NULL DEFAULT 'purple' 
    CHECK (color IN ('red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple', 'gray', 'black'));
    
    RAISE NOTICE 'color 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'color 컬럼이 이미 존재합니다.';
    -- 기존 컬럼의 기본값을 purple로 변경
    ALTER TABLE public.projects 
    ALTER COLUMN color SET DEFAULT 'purple';
    
    RAISE NOTICE 'color 컬럼의 기본값을 purple로 변경했습니다.';
  END IF;
END $$;

-- 기존 데이터의 color 값 설정 (NULL이면 purple로 설정)
DO $$
BEGIN
  UPDATE public.projects 
  SET color = 'purple' 
  WHERE color IS NULL;
  
  IF FOUND THEN
    RAISE NOTICE '기존 프로젝트의 color 값을 purple로 설정했습니다.';
  END IF;
END $$;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.projects.color IS '프로젝트 색상 (red, orange, yellow, green, blue, indigo, purple, gray, black)';

