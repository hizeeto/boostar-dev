-- ============================================
-- 프로젝트 테이블 완전 설정 스크립트
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 기존 테이블이 있다면 삭제 (주의: 기존 데이터가 모두 삭제됩니다)
-- 기존 데이터를 보존하려면 이 부분을 주석 처리하세요
-- DROP TABLE IF EXISTS public.projects CASCADE;

-- projects 테이블 생성 (이미 존재하면 무시)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  name TEXT NOT NULL,
  description TEXT,
  
  -- 상태 (예정, 진행, 종료, 보류)
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'on_hold')),
  
  -- 날짜 정보
  start_date DATE,
  target_date DATE,
  
  -- 소유자 정보
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 기존 테이블에 컬럼이 없는 경우에만 추가
DO $$ 
BEGIN
  -- start_date 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN start_date DATE;
  END IF;

  -- target_date 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'target_date'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN target_date DATE;
  END IF;
END $$;

-- 인덱스 생성 (이미 존재하면 무시)
CREATE INDEX IF NOT EXISTS projects_owner_id_idx 
ON public.projects(owner_id);

CREATE INDEX IF NOT EXISTS projects_status_idx 
ON public.projects(status);

CREATE INDEX IF NOT EXISTS projects_created_at_idx 
ON public.projects(created_at DESC);

CREATE INDEX IF NOT EXISTS projects_start_date_idx 
ON public.projects(start_date);

CREATE INDEX IF NOT EXISTS projects_target_date_idx 
ON public.projects(target_date);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거 (기존 트리거가 있으면 삭제 후 재생성)
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 활성화
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 기존 RLS 정책 삭제 (중복 방지)
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- RLS 정책: 사용자는 자신의 프로젝트를 읽을 수 있음
CREATE POLICY "Users can view own projects"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = owner_id);

-- RLS 정책: 사용자는 자신의 프로젝트를 생성할 수 있음
CREATE POLICY "Users can insert own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- RLS 정책: 사용자는 자신의 프로젝트를 업데이트할 수 있음
CREATE POLICY "Users can update own projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- RLS 정책: 사용자는 자신의 프로젝트를 삭제할 수 있음
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
COMMENT ON COLUMN public.projects.start_date IS '프로젝트 시작일';
COMMENT ON COLUMN public.projects.target_date IS '프로젝트 목표일';
COMMENT ON COLUMN public.projects.owner_id IS '프로젝트 소유자 ID (auth.users 참조)';
COMMENT ON COLUMN public.projects.created_at IS '생성일시';
COMMENT ON COLUMN public.projects.updated_at IS '수정일시';

-- ============================================
-- 실행 완료 메시지
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '프로젝트 테이블 설정이 완료되었습니다!';
  RAISE NOTICE '테이블: public.projects';
  RAISE NOTICE 'RLS 정책: 활성화됨';
  RAISE NOTICE '인덱스: 생성됨';
END $$;

