-- ============================================
-- 프로젝트 활성/보관 기능 추가 (완전 버전)
-- Supabase SQL Editor에서 바로 실행 가능
-- ============================================
-- 
-- 이 스크립트는 프로젝트 테이블에 is_archived 필드를 추가하여
-- 활성 프로젝트와 보관된 프로젝트를 구분할 수 있게 합니다.
--
-- 실행 방법:
-- 1. Supabase Dashboard > SQL Editor로 이동
-- 2. 아래 전체 SQL을 복사하여 붙여넣기
-- 3. Run 버튼 클릭
-- ============================================

-- is_archived 컬럼 추가 (기본값: false)
-- 이미 존재하는 경우 무시하고 계속 진행
DO $$ 
BEGIN
  -- is_archived 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'is_archived'
  ) THEN
    -- 컬럼 추가 (기본값: false = 활성 상태)
    ALTER TABLE public.projects 
    ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;
    
    RAISE NOTICE 'is_archived 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'is_archived 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- 인덱스 생성 (보관된 프로젝트 필터링 성능 향상)
-- 이미 존재하는 경우 무시
CREATE INDEX IF NOT EXISTS projects_is_archived_idx 
ON public.projects(is_archived);

-- 기존 데이터 확인 및 업데이트 (필요한 경우)
-- 모든 기존 프로젝트는 기본적으로 활성 상태(is_archived = false)입니다.
-- NULL 값이 있다면 false로 설정
DO $$
BEGIN
  UPDATE public.projects 
  SET is_archived = false 
  WHERE is_archived IS NULL;
  
  IF FOUND THEN
    RAISE NOTICE '기존 프로젝트의 is_archived 값을 false로 설정했습니다.';
  END IF;
END $$;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.projects.is_archived IS '프로젝트 보관 여부 (false: 활성, true: 보관)';

-- ============================================
-- 실행 완료 메시지
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '프로젝트 활성/보관 기능이 추가되었습니다!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '추가된 컬럼: is_archived (BOOLEAN, 기본값: false)';
  RAISE NOTICE '인덱스: projects_is_archived_idx';
  RAISE NOTICE '';
  RAISE NOTICE '사용 방법:';
  RAISE NOTICE '- 활성 프로젝트: is_archived = false';
  RAISE NOTICE '- 보관 프로젝트: is_archived = true';
  RAISE NOTICE '============================================';
END $$;

