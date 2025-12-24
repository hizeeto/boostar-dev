-- ============================================
-- 아티스트 테이블에 커버 이미지 컬럼 추가
-- ============================================

-- cover_image_url 컬럼 추가 (커버 이미지)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'cover_image_url'
  ) THEN
    ALTER TABLE public.artists 
    ADD COLUMN cover_image_url TEXT;
    
    RAISE NOTICE 'cover_image_url 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'cover_image_url 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- 컬럼 코멘트 추가
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'cover_image_url'
  ) THEN
    COMMENT ON COLUMN public.artists.cover_image_url IS '아티스트 커버 이미지 URL (16:3 비율)';
  END IF;
END $$;

