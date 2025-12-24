-- ============================================
-- 아티스트 테이블에 태그 컬럼 추가
-- ============================================

-- tags 컬럼 추가 (JSONB 배열 형식으로 태그 저장)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.artists 
    ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
    
    RAISE NOTICE 'tags 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'tags 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- 컬럼 코멘트 추가
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'tags'
  ) THEN
    COMMENT ON COLUMN public.artists.tags IS '태그 목록 (JSON 배열 형식: ["태그1", "태그2", ...])';
  END IF;
END $$;

