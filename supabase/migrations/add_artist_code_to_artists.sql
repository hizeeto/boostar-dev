-- ============================================
-- 아티스트 고유번호(artist_code) 컬럼 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- artist_code 컬럼 추가 (8자리 고유번호: 0-9, a-z, A-Z)
DO $$ 
BEGIN
  -- artist_code 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'artist_code'
  ) THEN
    -- 컬럼 추가 (고유 제약조건 포함)
    ALTER TABLE public.artists 
    ADD COLUMN artist_code VARCHAR(8) UNIQUE;
    
    RAISE NOTICE 'artist_code 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'artist_code 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- 인덱스 생성 (고유번호 검색 성능 향상)
CREATE INDEX IF NOT EXISTS artists_artist_code_idx 
ON public.artists(artist_code);

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.artists.artist_code IS '아티스트 고유번호 (8자리: 0-9, a-z, A-Z)';

-- 기존 아티스트에 고유번호 부여 함수
CREATE OR REPLACE FUNCTION generate_artist_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  code TEXT := '';
  i INTEGER;
  exists_check BOOLEAN;
BEGIN
  -- 중복되지 않는 고유번호 생성
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    
    -- 중복 확인
    SELECT EXISTS(SELECT 1 FROM public.artists WHERE artist_code = code) INTO exists_check;
    
    -- 중복되지 않으면 루프 종료
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 기존 아티스트에 고유번호 부여
DO $$
DECLARE
  artist_record RECORD;
  new_code TEXT;
BEGIN
  -- artist_code가 NULL인 모든 아티스트에 고유번호 부여
  FOR artist_record IN 
    SELECT id FROM public.artists WHERE artist_code IS NULL
  LOOP
    new_code := generate_artist_code();
    
    UPDATE public.artists
    SET artist_code = new_code
    WHERE id = artist_record.id;
    
    RAISE NOTICE '아티스트 %에 고유번호 % 부여', artist_record.id, new_code;
  END LOOP;
  
  RAISE NOTICE '기존 아티스트에 고유번호 부여가 완료되었습니다.';
END $$;

-- 함수 정리 (더 이상 필요 없으므로 삭제)
DROP FUNCTION IF EXISTS generate_artist_code();

