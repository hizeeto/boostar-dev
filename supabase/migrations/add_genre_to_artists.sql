-- ============================================
-- 아티스트 테이블에 장르 컬럼 추가
-- ============================================

-- main_genre 컬럼 추가 (대표 장르)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'main_genre'
  ) THEN
    ALTER TABLE public.artists 
    ADD COLUMN main_genre TEXT;
    
    RAISE NOTICE 'main_genre 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'main_genre 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- sub_genre 컬럼 추가 (세부 장르)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'sub_genre'
  ) THEN
    ALTER TABLE public.artists 
    ADD COLUMN sub_genre TEXT;
    
    RAISE NOTICE 'sub_genre 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'sub_genre 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- custom_genre 컬럼 추가 (직접 입력 장르)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'custom_genre'
  ) THEN
    ALTER TABLE public.artists 
    ADD COLUMN custom_genre TEXT;
    
    RAISE NOTICE 'custom_genre 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'custom_genre 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- 컬럼 코멘트 추가
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'main_genre'
  ) THEN
    COMMENT ON COLUMN public.artists.main_genre IS '대표 장르';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'sub_genre'
  ) THEN
    COMMENT ON COLUMN public.artists.sub_genre IS '세부 장르';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'custom_genre'
  ) THEN
    COMMENT ON COLUMN public.artists.custom_genre IS '직접 입력 장르 (기타 선택 시)';
  END IF;
END $$;

