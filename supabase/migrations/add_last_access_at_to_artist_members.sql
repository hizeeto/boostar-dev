-- ============================================
-- artist_members 테이블에 마지막 접속일 컬럼 추가
-- ============================================

-- last_access_at 컬럼 추가
ALTER TABLE public.artist_members
ADD COLUMN IF NOT EXISTS last_access_at TIMESTAMPTZ;

-- 컬럼 코멘트
COMMENT ON COLUMN public.artist_members.last_access_at IS '마지막 접속일시';

-- 인덱스 생성 (마지막 접속일 기준 정렬을 위해)
CREATE INDEX IF NOT EXISTS artist_members_last_access_at_idx 
ON public.artist_members(last_access_at);

