-- ============================================
-- SNS 플랫폼 목록 업데이트
-- Website, Soundcloud, Weverse 추가 (E-mail 제외)
-- ============================================

-- sns 컬럼 코멘트 업데이트 (새로운 플랫폼 반영)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artists' 
    AND column_name = 'sns'
  ) THEN
    COMMENT ON COLUMN public.artists.sns IS 'SNS 정보 (JSON 형식: {"instagram": "url", "twitter": "url", "youtube": "url", "tiktok": "url", "facebook": "url", "naver": "url", "website": "url", "soundcloud": "url", "weverse": "url", ...})';
    
    RAISE NOTICE 'sns 컬럼 코멘트가 업데이트되었습니다.';
  ELSE
    RAISE NOTICE 'sns 컬럼이 존재하지 않습니다.';
  END IF;
END $$;

