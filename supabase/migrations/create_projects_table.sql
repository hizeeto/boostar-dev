-- projects 테이블이 이미 존재한다면 먼저 삭제 (CASCADE로 의존성 제거)
DROP TABLE IF EXISTS public.projects CASCADE;

-- projects 테이블 생성
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  name TEXT NOT NULL,
  description TEXT,
  
  -- 상태 (예정, 진행, 종료, 보류)
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'on_hold')),
  
  -- 소유자 정보
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- owner_id 인덱스 (사용자의 프로젝트 조회 성능 향상)
CREATE INDEX projects_owner_id_idx 
ON public.projects(owner_id);

-- status 인덱스 (상태별 필터링 성능 향상)
CREATE INDEX projects_status_idx 
ON public.projects(status);

-- created_at 인덱스 (최신순 정렬 성능 향상)
CREATE INDEX projects_created_at_idx 
ON public.projects(created_at DESC);

-- updated_at 자동 업데이트 트리거 함수 (이미 존재하면 재사용)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 활성화
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 프로젝트를 읽을 수 있음
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can view own projects"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = owner_id);

-- RLS 정책: 사용자는 자신의 프로젝트를 생성할 수 있음
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
CREATE POLICY "Users can insert own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- RLS 정책: 사용자는 자신의 프로젝트를 업데이트할 수 있음
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- RLS 정책: 사용자는 자신의 프로젝트를 삭제할 수 있음
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects"
  ON public.projects
  FOR DELETE
  USING (auth.uid() = owner_id);

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE public.projects IS '프로젝트 정보 테이블';
COMMENT ON COLUMN public.projects.id IS '프로젝트 ID (UUID)';
COMMENT ON COLUMN public.projects.name IS '프로젝트명';
COMMENT ON COLUMN public.projects.description IS '프로젝트 설명';
COMMENT ON COLUMN public.projects.status IS '프로젝트 상태 (planned: 예정, active: 진행, completed: 종료, on_hold: 보류)';
COMMENT ON COLUMN public.projects.owner_id IS '프로젝트 소유자 ID (auth.users 참조)';
COMMENT ON COLUMN public.projects.created_at IS '생성일시';
COMMENT ON COLUMN public.projects.updated_at IS '수정일시';

