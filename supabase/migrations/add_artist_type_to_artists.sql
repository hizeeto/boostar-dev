-- ============================================
-- 아티스트 테이블에 아티스트 유형 컬럼 추가
-- ============================================

-- artist_type 컬럼 추가 (아티스트 유형)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'artist_type'
  ) THEN
    ALTER TABLE public.artists 
    ADD COLUMN artist_type TEXT;
    
    RAISE NOTICE 'artist_type 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'artist_type 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- custom_artist_type 컬럼 추가 (직접 입력 아티스트 유형)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'custom_artist_type'
  ) THEN
    ALTER TABLE public.artists 
    ADD COLUMN custom_artist_type TEXT;
    
    RAISE NOTICE 'custom_artist_type 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'custom_artist_type 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- 컬럼 코멘트 추가
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'artist_type'
  ) THEN
    COMMENT ON COLUMN public.artists.artist_type IS '아티스트 유형';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'custom_artist_type'
  ) THEN
    COMMENT ON COLUMN public.artists.custom_artist_type IS '직접 입력 아티스트 유형 (기타 선택 시)';
  END IF;
END $$;

