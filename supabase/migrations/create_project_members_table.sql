-- ============================================
-- 프로젝트 멤버(Project Members) 테이블 생성
-- 프로젝트에 속한 멤버 관리
-- ============================================

-- project_members 테이블 생성
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 프로젝트 정보
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- 멤버 정보
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 역할 및 권한
  role TEXT NOT NULL DEFAULT '멤버' CHECK (role IN ('소유자', '관리자', '멤버')),
  permission TEXT NOT NULL DEFAULT '조회 권한' CHECK (permission IN ('전체 권한', '편집 권한', '조회 권한')),
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_access_at TIMESTAMPTZ,
  
  -- 제약조건: 한 프로젝트에 같은 사용자는 한 번만 추가 가능
  CONSTRAINT project_members_project_user_unique UNIQUE (project_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS project_members_project_id_idx 
ON public.project_members(project_id);

CREATE INDEX IF NOT EXISTS project_members_user_id_idx 
ON public.project_members(user_id);

CREATE INDEX IF NOT EXISTS project_members_project_id_role_idx 
ON public.project_members(project_id, role);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE public.project_members IS '프로젝트 멤버 정보 테이블';
COMMENT ON COLUMN public.project_members.id IS '멤버 ID (UUID)';
COMMENT ON COLUMN public.project_members.project_id IS '프로젝트 ID (projects 테이블 참조)';
COMMENT ON COLUMN public.project_members.user_id IS '멤버 사용자 ID (auth.users 참조)';
COMMENT ON COLUMN public.project_members.role IS '멤버 역할 (소유자, 관리자, 멤버)';
COMMENT ON COLUMN public.project_members.permission IS '멤버 권한 (전체 권한, 편집 권한, 조회 권한)';
COMMENT ON COLUMN public.project_members.created_at IS '생성일시';
COMMENT ON COLUMN public.project_members.updated_at IS '수정일시';
COMMENT ON COLUMN public.project_members.last_access_at IS '마지막 접속일시';

-- RLS 활성화
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- RLS 정책 1: 프로젝트 소유자와 멤버는 자신이 속한 프로젝트의 멤버를 조회할 수 있음
CREATE POLICY "Members can view project members"
ON public.project_members
FOR SELECT
TO authenticated
USING (
  -- 프로젝트 소유자인 경우
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = auth.uid()
  )
  OR
  -- 프로젝트 멤버인 경우
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = project_members.project_id
    AND project_members.user_id = auth.uid()
  )
  OR
  -- 아티스트 멤버인 경우 (같은 아티스트의 프로젝트)
  EXISTS (
    SELECT 1 FROM public.projects
    INNER JOIN public.artist_members ON projects.artist_id = artist_members.artist_id
    WHERE projects.id = project_members.project_id
    AND artist_members.user_id = auth.uid()
  )
);

-- RLS 정책 2: 프로젝트 소유자와 아티스트 소유자/관리자는 멤버를 추가할 수 있음
CREATE POLICY "Owners can insert project members"
ON public.project_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- 프로젝트 소유자인 경우
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = auth.uid()
  )
  OR
  -- 아티스트 소유자 또는 관리자인 경우
  EXISTS (
    SELECT 1 FROM public.projects
    INNER JOIN public.artists ON projects.artist_id = artists.id
    LEFT JOIN public.artist_members ON artists.id = artist_members.artist_id AND artist_members.user_id = auth.uid()
    WHERE projects.id = project_members.project_id
    AND (
      artists.user_id = auth.uid()
      OR artist_members.permission IN ('전체 권한', '편집 권한')
    )
  )
);

-- RLS 정책 3: 프로젝트 소유자와 아티스트 소유자/관리자는 멤버 정보를 수정할 수 있음
CREATE POLICY "Owners can update project members"
ON public.project_members
FOR UPDATE
TO authenticated
USING (
  -- 프로젝트 소유자인 경우
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = auth.uid()
  )
  OR
  -- 아티스트 소유자 또는 관리자인 경우
  EXISTS (
    SELECT 1 FROM public.projects
    INNER JOIN public.artists ON projects.artist_id = artists.id
    LEFT JOIN public.artist_members ON artists.id = artist_members.artist_id AND artist_members.user_id = auth.uid()
    WHERE projects.id = project_members.project_id
    AND (
      artists.user_id = auth.uid()
      OR artist_members.permission IN ('전체 권한', '편집 권한')
    )
  )
)
WITH CHECK (
  -- 프로젝트 소유자인 경우
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = auth.uid()
  )
  OR
  -- 아티스트 소유자 또는 관리자인 경우
  EXISTS (
    SELECT 1 FROM public.projects
    INNER JOIN public.artists ON projects.artist_id = artists.id
    LEFT JOIN public.artist_members ON artists.id = artist_members.artist_id AND artist_members.user_id = auth.uid()
    WHERE projects.id = project_members.project_id
    AND (
      artists.user_id = auth.uid()
      OR artist_members.permission IN ('전체 권한', '편집 권한')
    )
  )
);

-- RLS 정책 4: 프로젝트 소유자와 아티스트 소유자/관리자는 멤버를 삭제할 수 있음
CREATE POLICY "Owners can delete project members"
ON public.project_members
FOR DELETE
TO authenticated
USING (
  -- 프로젝트 소유자인 경우
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = auth.uid()
  )
  OR
  -- 아티스트 소유자 또는 관리자인 경우
  EXISTS (
    SELECT 1 FROM public.projects
    INNER JOIN public.artists ON projects.artist_id = artists.id
    LEFT JOIN public.artist_members ON artists.id = artist_members.artist_id AND artist_members.user_id = auth.uid()
    WHERE projects.id = project_members.project_id
    AND (
      artists.user_id = auth.uid()
      OR artist_members.permission IN ('전체 권한', '편집 권한')
    )
  )
);

