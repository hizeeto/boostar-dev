-- ============================================
-- 아티스트 프로필 필드 추가
-- 한국어/영어 이름, SNS, 기획사 필드 추가
-- ============================================

-- name_en 컬럼 추가 (영어 이름)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'name_en'
  ) THEN
    ALTER TABLE public.artists 
    ADD COLUMN name_en TEXT;
    
    RAISE NOTICE 'name_en 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'name_en 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- name을 name_ko로 변경 (한국어 이름)
DO $$ 
DECLARE
  name_exists BOOLEAN;
  name_ko_exists BOOLEAN;
BEGIN
  -- name_ko 컬럼 존재 여부 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'name_ko'
  ) INTO name_ko_exists;
  
  -- name_ko가 없을 때만 처리
  IF NOT name_ko_exists THEN
    -- name 컬럼 존재 여부 확인
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'artists' 
      AND column_name = 'name'
    ) INTO name_exists;
    
    IF name_exists THEN
      -- 기존 제약조건 삭제
      ALTER TABLE public.artists 
      DROP CONSTRAINT IF EXISTS artists_user_name_unique;
      
      -- name 컬럼을 name_ko로 이름 변경
      ALTER TABLE public.artists 
      RENAME COLUMN name TO name_ko;
      
      -- 제약조건 재생성 (name_ko 기준, 이미 존재하면 스킵)
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.artists'::regclass
        AND conname = 'artists_user_name_ko_unique'
      ) THEN
        ALTER TABLE public.artists 
        ADD CONSTRAINT artists_user_name_ko_unique UNIQUE (user_id, name_ko);
      END IF;
      
      RAISE NOTICE 'name 컬럼이 name_ko로 변경되었습니다.';
    ELSE
      -- name 컬럼이 없으면 name_ko를 새로 생성
      ALTER TABLE public.artists 
      ADD COLUMN name_ko TEXT;
      
      RAISE NOTICE 'name_ko 컬럼이 새로 생성되었습니다.';
    END IF;
  ELSE
    RAISE NOTICE 'name_ko 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- sns 컬럼 추가 (JSON 형식으로 여러 SNS 저장)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'sns'
  ) THEN
    ALTER TABLE public.artists 
    ADD COLUMN sns JSONB DEFAULT '{}'::jsonb;
    
    RAISE NOTICE 'sns 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'sns 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- agency 컬럼 추가 (기획사)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'agency'
  ) THEN
    ALTER TABLE public.artists 
    ADD COLUMN agency TEXT;
    
    RAISE NOTICE 'agency 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'agency 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- 컬럼 코멘트 추가 (항상 업데이트)
DO $$ 
BEGIN
  -- name_ko 코멘트 (컬럼이 존재하는 경우에만)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'name_ko'
  ) THEN
    COMMENT ON COLUMN public.artists.name_ko IS '아티스트 이름 (한국어)';
  END IF;
  
  -- name_en 코멘트 (컬럼이 존재하는 경우에만)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'name_en'
  ) THEN
    COMMENT ON COLUMN public.artists.name_en IS '아티스트 이름 (영어)';
  END IF;
  
  -- sns 코멘트 (컬럼이 존재하는 경우에만)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'sns'
  ) THEN
    COMMENT ON COLUMN public.artists.sns IS 'SNS 정보 (JSON 형식: {"instagram": "url", "twitter": "url", ...})';
  END IF;
  
  -- agency 코멘트 (컬럼이 존재하는 경우에만)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'agency'
  ) THEN
    COMMENT ON COLUMN public.artists.agency IS '기획사 이름';
  END IF;
END $$;

-- names 컬럼 추가 (다국어 이름을 JSON 형식으로 저장)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'names'
  ) THEN
    ALTER TABLE public.artists 
    ADD COLUMN names JSONB DEFAULT '{}'::jsonb;
    
    RAISE NOTICE 'names 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'names 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- names 컬럼 코멘트 추가
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'names'
  ) THEN
    COMMENT ON COLUMN public.artists.names IS '다국어 이름 (JSON 형식: {"ko": "한국어 이름", "en": "English name", "ja": "日本語名", ...})';
  END IF;
END $$;

-- 기존 name_ko, name_en 데이터를 names JSONB로 마이그레이션
DO $$ 
DECLARE
  names_exists BOOLEAN;
  name_ko_exists BOOLEAN;
  name_en_exists BOOLEAN;
BEGIN
  -- names 컬럼 존재 여부 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'names'
  ) INTO names_exists;
  
  -- name_ko 컬럼 존재 여부 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'name_ko'
  ) INTO name_ko_exists;
  
  -- name_en 컬럼 존재 여부 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'name_en'
  ) INTO name_en_exists;
  
  -- names 컬럼이 있고, name_ko나 name_en이 있으면 데이터 마이그레이션
  IF names_exists AND (name_ko_exists OR name_en_exists) THEN
    -- names가 비어있거나 null인 경우에만 name_ko, name_en에서 마이그레이션
    UPDATE public.artists
    SET names = jsonb_build_object(
      'ko', COALESCE(name_ko, ''),
      'en', COALESCE(name_en, '')
    )
    WHERE (names IS NULL OR names = '{}'::jsonb)
      AND (name_ko IS NOT NULL OR name_en IS NOT NULL);
    
    RAISE NOTICE '기존 name_ko, name_en 데이터를 names JSONB로 마이그레이션했습니다.';
  END IF;
END $$;

-- name_ko, name_en 컬럼 제거 (names JSONB만 사용)
DO $$ 
DECLARE
  name_ko_exists BOOLEAN;
  name_en_exists BOOLEAN;
  names_exists BOOLEAN;
BEGIN
  -- names 컬럼 존재 여부 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'names'
  ) INTO names_exists;
  
  -- name_ko 컬럼 존재 여부 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'name_ko'
  ) INTO name_ko_exists;
  
  -- name_en 컬럼 존재 여부 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'name_en'
  ) INTO name_en_exists;
  
  -- names 컬럼이 있고, name_ko나 name_en이 있으면 제거
  IF names_exists THEN
    -- name_ko 제약조건 제거
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conrelid = 'public.artists'::regclass
      AND conname = 'artists_user_name_ko_unique'
    ) THEN
      ALTER TABLE public.artists 
      DROP CONSTRAINT IF EXISTS artists_user_name_ko_unique;
      RAISE NOTICE 'artists_user_name_ko_unique 제약조건이 제거되었습니다.';
    END IF;
    
    -- name_ko 컬럼 제거
    IF name_ko_exists THEN
      ALTER TABLE public.artists 
      DROP COLUMN IF EXISTS name_ko;
      RAISE NOTICE 'name_ko 컬럼이 제거되었습니다.';
    END IF;
    
    -- name_en 컬럼 제거
    IF name_en_exists THEN
      ALTER TABLE public.artists 
      DROP COLUMN IF EXISTS name_en;
      RAISE NOTICE 'name_en 컬럼이 제거되었습니다.';
    END IF;
  END IF;
END $$;

