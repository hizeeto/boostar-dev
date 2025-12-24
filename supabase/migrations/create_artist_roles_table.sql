-- ============================================
-- 아티스트 역할(Artist Roles) 테이블 생성
-- 아티스트 스페이스에서 사용할 역할 관리
-- ============================================

-- artist_roles 테이블 생성
CREATE TABLE IF NOT EXISTS public.artist_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 아티스트 정보
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  
  -- 역할 정보
  category TEXT NOT NULL, -- 카테고리 (예: "팀 운영", "보컬·랩")
  role_name TEXT NOT NULL, -- 역할명 (예: "리더", "보컬")
  
  -- 활성화 여부 (아티스트 스페이스에서 사용할지 여부)
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- 정렬 순서
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- 제약조건: 한 아티스트에 같은 역할은 한 번만 추가 가능
  CONSTRAINT artist_roles_artist_category_role_unique UNIQUE (artist_id, category, role_name)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS artist_roles_artist_id_idx 
ON public.artist_roles(artist_id);

CREATE INDEX IF NOT EXISTS artist_roles_artist_id_enabled_idx 
ON public.artist_roles(artist_id, is_enabled);

CREATE INDEX IF NOT EXISTS artist_roles_artist_id_category_idx 
ON public.artist_roles(artist_id, category);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_artist_roles_updated_at
  BEFORE UPDATE ON public.artist_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE public.artist_roles IS '아티스트별 사용 가능한 역할 목록';
COMMENT ON COLUMN public.artist_roles.id IS '역할 ID (UUID)';
COMMENT ON COLUMN public.artist_roles.artist_id IS '아티스트 ID (artists 테이블 참조)';
COMMENT ON COLUMN public.artist_roles.category IS '역할 카테고리 (예: "팀 운영", "보컬·랩")';
COMMENT ON COLUMN public.artist_roles.role_name IS '역할명 (예: "리더", "보컬")';
COMMENT ON COLUMN public.artist_roles.is_enabled IS '활성화 여부 (true: 사용, false: 미사용)';
COMMENT ON COLUMN public.artist_roles.display_order IS '정렬 순서';
COMMENT ON COLUMN public.artist_roles.created_at IS '생성일시';
COMMENT ON COLUMN public.artist_roles.updated_at IS '수정일시';

-- RLS 활성화
ALTER TABLE public.artist_roles ENABLE ROW LEVEL SECURITY;

-- RLS 정책 1: 아티스트 소유자와 관리자는 자신이 속한 아티스트의 역할을 조회할 수 있음
CREATE POLICY "Members can view artist roles"
ON public.artist_roles
FOR SELECT
TO authenticated
USING (
  -- 아티스트 소유자인 경우
  EXISTS (
    SELECT 1 FROM public.artists
    WHERE artists.id = artist_roles.artist_id
    AND artists.user_id = auth.uid()
  )
  OR
  -- 아티스트 멤버인 경우 (관리자 이상)
  EXISTS (
    SELECT 1 FROM public.artist_members
    WHERE artist_members.artist_id = artist_roles.artist_id
    AND artist_members.user_id = auth.uid()
    AND artist_members.permission IN ('전체 권한', '편집 권한')
  )
);

-- RLS 정책 2: 아티스트 소유자와 관리자만 역할을 추가할 수 있음
CREATE POLICY "Owners and admins can insert artist roles"
ON public.artist_roles
FOR INSERT
TO authenticated
WITH CHECK (
  -- 아티스트 소유자인 경우
  EXISTS (
    SELECT 1 FROM public.artists
    WHERE artists.id = artist_roles.artist_id
    AND artists.user_id = auth.uid()
  )
  OR
  -- 아티스트 관리자인 경우
  EXISTS (
    SELECT 1 FROM public.artist_members
    WHERE artist_members.artist_id = artist_roles.artist_id
    AND artist_members.user_id = auth.uid()
    AND artist_members.permission IN ('전체 권한', '편집 권한')
  )
);

-- RLS 정책 3: 아티스트 소유자와 관리자만 역할 정보를 수정할 수 있음
CREATE POLICY "Owners and admins can update artist roles"
ON public.artist_roles
FOR UPDATE
TO authenticated
USING (
  -- 아티스트 소유자인 경우
  EXISTS (
    SELECT 1 FROM public.artists
    WHERE artists.id = artist_roles.artist_id
    AND artists.user_id = auth.uid()
  )
  OR
  -- 아티스트 관리자인 경우
  EXISTS (
    SELECT 1 FROM public.artist_members
    WHERE artist_members.artist_id = artist_roles.artist_id
    AND artist_members.user_id = auth.uid()
    AND artist_members.permission IN ('전체 권한', '편집 권한')
  )
)
WITH CHECK (
  -- 아티스트 소유자인 경우
  EXISTS (
    SELECT 1 FROM public.artists
    WHERE artists.id = artist_roles.artist_id
    AND artists.user_id = auth.uid()
  )
  OR
  -- 아티스트 관리자인 경우
  EXISTS (
    SELECT 1 FROM public.artist_members
    WHERE artist_members.artist_id = artist_roles.artist_id
    AND artist_members.user_id = auth.uid()
    AND artist_members.permission IN ('전체 권한', '편집 권한')
  )
);

-- RLS 정책 4: 아티스트 소유자와 관리자만 역할을 삭제할 수 있음
CREATE POLICY "Owners and admins can delete artist roles"
ON public.artist_roles
FOR DELETE
TO authenticated
USING (
  -- 아티스트 소유자인 경우
  EXISTS (
    SELECT 1 FROM public.artists
    WHERE artists.id = artist_roles.artist_id
    AND artists.user_id = auth.uid()
  )
  OR
  -- 아티스트 관리자인 경우
  EXISTS (
    SELECT 1 FROM public.artist_members
    WHERE artist_members.artist_id = artist_roles.artist_id
    AND artist_members.user_id = auth.uid()
    AND artist_members.permission IN ('전체 권한', '편집 권한')
  )
);

