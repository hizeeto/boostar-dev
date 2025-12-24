-- ============================================
-- 아티스트 테이블에 데뷔/결성일 컬럼 추가
-- ============================================

-- debut_date 컬럼 추가 (DATE 타입)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'debut_date'
  ) THEN
    ALTER TABLE public.artists 
    ADD COLUMN debut_date DATE;
    
    RAISE NOTICE 'debut_date 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'debut_date 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- debut_date 컬럼 코멘트 추가
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'debut_date'
  ) THEN
    COMMENT ON COLUMN public.artists.debut_date IS '데뷔일 또는 결성일';
  END IF;
END $$;

