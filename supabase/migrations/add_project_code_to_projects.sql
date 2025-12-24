-- ============================================
-- 프로젝트 고유번호(project_code) 컬럼 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- project_code 컬럼 추가 (8자리 고유번호: 0-9, a-z, A-Z)
DO $$ 
BEGIN
  -- project_code 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'project_code'
  ) THEN
    -- 컬럼 추가 (고유 제약조건 포함)
    ALTER TABLE public.projects 
    ADD COLUMN project_code VARCHAR(8) UNIQUE;
    
    RAISE NOTICE 'project_code 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'project_code 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- 인덱스 생성 (고유번호 검색 성능 향상)
CREATE INDEX IF NOT EXISTS projects_project_code_idx 
ON public.projects(project_code);

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.projects.project_code IS '프로젝트 고유번호 (8자리: 0-9, a-z, A-Z)';

