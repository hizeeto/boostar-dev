-- ============================================
-- 아티스트(Artists) 테이블 생성
-- 사용자가 생성하는 업무 프로필
-- ============================================

-- artists 테이블 생성
CREATE TABLE IF NOT EXISTS public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 소유자 정보
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 기본 정보
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  color TEXT, -- 사이드바 아이콘 색상 (예: #FF5733)
  
  -- 기본 아티스트 여부 (사용자당 하나만 true)
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- 정렬 순서 (사이드바 표시 순서)
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- 제약조건: 사용자당 이름은 유니크
  CONSTRAINT artists_user_name_unique UNIQUE (user_id, name)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS artists_user_id_idx 
ON public.artists(user_id);

CREATE INDEX IF NOT EXISTS artists_user_id_is_default_idx 
ON public.artists(user_id, is_default) 
WHERE is_default = true;

CREATE INDEX IF NOT EXISTS artists_user_id_sort_order_idx 
ON public.artists(user_id, sort_order);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_artists_updated_at
  BEFORE UPDATE ON public.artists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 기본 아티스트 제약조건 함수
-- 사용자당 하나의 기본 아티스트만 허용
CREATE OR REPLACE FUNCTION ensure_single_default_artist()
RETURNS TRIGGER AS $$
BEGIN
  -- 새로 기본 아티스트로 설정되는 경우
  IF NEW.is_default = true THEN
    -- 같은 사용자의 다른 기본 아티스트를 false로 변경
    UPDATE public.artists
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기본 아티스트 제약조건 트리거
CREATE TRIGGER ensure_single_default_artist_trigger
  AFTER INSERT OR UPDATE OF is_default ON public.artists
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_artist();

-- RLS (Row Level Security) 활성화
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 아티스트를 읽을 수 있음
DROP POLICY IF EXISTS "Users can view own artists" ON public.artists;
CREATE POLICY "Users can view own artists"
  ON public.artists
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 아티스트를 생성할 수 있음
DROP POLICY IF EXISTS "Users can insert own artists" ON public.artists;
CREATE POLICY "Users can insert own artists"
  ON public.artists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 아티스트를 업데이트할 수 있음
DROP POLICY IF EXISTS "Users can update own artists" ON public.artists;
CREATE POLICY "Users can update own artists"
  ON public.artists
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 아티스트를 삭제할 수 있음
DROP POLICY IF EXISTS "Users can delete own artists" ON public.artists;
CREATE POLICY "Users can delete own artists"
  ON public.artists
  FOR DELETE
  USING (auth.uid() = user_id);

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE public.artists IS '아티스트(업무 프로필) 정보 테이블';
COMMENT ON COLUMN public.artists.id IS '아티스트 ID (UUID)';
COMMENT ON COLUMN public.artists.user_id IS '아티스트 소유자 ID (auth.users 참조)';
COMMENT ON COLUMN public.artists.name IS '아티스트 이름';
COMMENT ON COLUMN public.artists.description IS '아티스트 설명';
COMMENT ON COLUMN public.artists.icon_url IS '아티스트 아이콘 이미지 URL';
COMMENT ON COLUMN public.artists.color IS '아티스트 색상 코드 (사이드바 아이콘 색상)';
COMMENT ON COLUMN public.artists.is_default IS '기본 아티스트 여부 (사용자당 하나만 true)';
COMMENT ON COLUMN public.artists.sort_order IS '정렬 순서 (사이드바 표시 순서)';
COMMENT ON COLUMN public.artists.created_at IS '생성일시';
COMMENT ON COLUMN public.artists.updated_at IS '수정일시';

