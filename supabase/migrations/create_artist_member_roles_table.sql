-- ============================================
-- 아티스트 멤버-역할 매핑 테이블 생성
-- 멤버에게 여러 역할을 할당할 수 있도록 함
-- ============================================

-- artist_member_roles 테이블 생성
CREATE TABLE IF NOT EXISTS public.artist_member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 멤버 정보
  member_id UUID NOT NULL REFERENCES public.artist_members(id) ON DELETE CASCADE,
  
  -- 역할 정보
  role_id UUID NOT NULL REFERENCES public.artist_roles(id) ON DELETE CASCADE,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- 제약조건: 한 멤버에 같은 역할은 한 번만 추가 가능
  CONSTRAINT artist_member_roles_member_role_unique UNIQUE (member_id, role_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS artist_member_roles_member_id_idx 
ON public.artist_member_roles(member_id);

CREATE INDEX IF NOT EXISTS artist_member_roles_role_id_idx 
ON public.artist_member_roles(role_id);

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE public.artist_member_roles IS '멤버-역할 매핑 테이블 (한 멤버에 여러 역할 할당 가능)';
COMMENT ON COLUMN public.artist_member_roles.id IS '매핑 ID (UUID)';
COMMENT ON COLUMN public.artist_member_roles.member_id IS '멤버 ID (artist_members 테이블 참조)';
COMMENT ON COLUMN public.artist_member_roles.role_id IS '역할 ID (artist_roles 테이블 참조)';

-- RLS 활성화
ALTER TABLE public.artist_member_roles ENABLE ROW LEVEL SECURITY;

-- RLS 정책 1: 아티스트 소유자와 멤버는 자신이 속한 아티스트의 멤버 역할을 조회할 수 있음
CREATE POLICY "Members can view artist member roles"
ON public.artist_member_roles
FOR SELECT
TO authenticated
USING (
  -- 아티스트 소유자인 경우
  EXISTS (
    SELECT 1 FROM public.artist_members am
    JOIN public.artists a ON a.id = am.artist_id
    WHERE am.id = artist_member_roles.member_id
    AND a.user_id = auth.uid()
  )
  OR
  -- 아티스트 멤버인 경우
  EXISTS (
    SELECT 1 FROM public.artist_members am
    WHERE am.id = artist_member_roles.member_id
    AND am.user_id = auth.uid()
  )
);

-- RLS 정책 2: 아티스트 소유자만 멤버 역할을 추가할 수 있음
CREATE POLICY "Owners can insert artist member roles"
ON public.artist_member_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.artist_members am
    JOIN public.artists a ON a.id = am.artist_id
    WHERE am.id = artist_member_roles.member_id
    AND a.user_id = auth.uid()
  )
);

-- RLS 정책 3: 아티스트 소유자만 멤버 역할을 삭제할 수 있음
CREATE POLICY "Owners can delete artist member roles"
ON public.artist_member_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.artist_members am
    JOIN public.artists a ON a.id = am.artist_id
    WHERE am.id = artist_member_roles.member_id
    AND a.user_id = auth.uid()
  )
);

