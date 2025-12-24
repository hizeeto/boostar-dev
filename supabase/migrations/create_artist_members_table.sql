-- ============================================
-- 아티스트 멤버(Artist Members) 테이블 생성
-- 아티스트에 속한 멤버 관리
-- ============================================

-- artist_members 테이블 생성
CREATE TABLE IF NOT EXISTS public.artist_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 아티스트 정보
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  
  -- 멤버 정보
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 역할 및 권한
  role TEXT NOT NULL DEFAULT '멤버' CHECK (role IN ('소유자', '관리자', '멤버')),
  permission TEXT NOT NULL DEFAULT '조회 권한' CHECK (permission IN ('전체 권한', '편집 권한', '조회 권한')),
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- 제약조건: 한 아티스트에 같은 사용자는 한 번만 추가 가능
  CONSTRAINT artist_members_artist_user_unique UNIQUE (artist_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS artist_members_artist_id_idx 
ON public.artist_members(artist_id);

CREATE INDEX IF NOT EXISTS artist_members_user_id_idx 
ON public.artist_members(user_id);

CREATE INDEX IF NOT EXISTS artist_members_artist_id_role_idx 
ON public.artist_members(artist_id, role);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_artist_members_updated_at
  BEFORE UPDATE ON public.artist_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE public.artist_members IS '아티스트 멤버 정보 테이블';
COMMENT ON COLUMN public.artist_members.id IS '멤버 ID (UUID)';
COMMENT ON COLUMN public.artist_members.artist_id IS '아티스트 ID (artists 테이블 참조)';
COMMENT ON COLUMN public.artist_members.user_id IS '멤버 사용자 ID (auth.users 참조)';
COMMENT ON COLUMN public.artist_members.role IS '멤버 역할 (소유자, 관리자, 멤버)';
COMMENT ON COLUMN public.artist_members.permission IS '멤버 권한 (전체 권한, 편집 권한, 조회 권한)';
COMMENT ON COLUMN public.artist_members.created_at IS '생성일시';
COMMENT ON COLUMN public.artist_members.updated_at IS '수정일시';

-- RLS 활성화
ALTER TABLE public.artist_members ENABLE ROW LEVEL SECURITY;

-- RLS 정책 1: 아티스트 소유자와 멤버는 자신이 속한 아티스트의 멤버를 조회할 수 있음
CREATE POLICY "Members can view artist members"
ON public.artist_members
FOR SELECT
TO authenticated
USING (
  -- 아티스트 소유자인 경우
  EXISTS (
    SELECT 1 FROM public.artists
    WHERE artists.id = artist_members.artist_id
    AND artists.user_id = auth.uid()
  )
  OR
  -- 아티스트 멤버인 경우
  EXISTS (
    SELECT 1 FROM public.artist_members
    WHERE artist_members.artist_id = artist_members.artist_id
    AND artist_members.user_id = auth.uid()
  )
);

-- RLS 정책 2: 아티스트 소유자만 멤버를 추가할 수 있음
CREATE POLICY "Owners can insert artist members"
ON public.artist_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.artists
    WHERE artists.id = artist_members.artist_id
    AND artists.user_id = auth.uid()
  )
);

-- RLS 정책 3: 아티스트 소유자만 멤버 정보를 수정할 수 있음
CREATE POLICY "Owners can update artist members"
ON public.artist_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.artists
    WHERE artists.id = artist_members.artist_id
    AND artists.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.artists
    WHERE artists.id = artist_members.artist_id
    AND artists.user_id = auth.uid()
  )
);

-- RLS 정책 4: 아티스트 소유자만 멤버를 삭제할 수 있음
CREATE POLICY "Owners can delete artist members"
ON public.artist_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.artists
    WHERE artists.id = artist_members.artist_id
    AND artists.user_id = auth.uid()
  )
);

