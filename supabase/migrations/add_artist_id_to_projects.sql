-- ============================================
-- projects 테이블에 artist_id 컬럼 추가
-- 프로젝트를 아티스트에 귀속시킴
-- ============================================

-- artist_id 컬럼 추가
DO $$ 
BEGIN
  -- artist_id 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'artist_id'
  ) THEN
    -- 컬럼 추가 (NOT NULL은 나중에 데이터 마이그레이션 후 설정)
    ALTER TABLE public.projects 
    ADD COLUMN artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'artist_id 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'artist_id 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- 인덱스 생성 (아티스트별 프로젝트 조회 성능 향상)
CREATE INDEX IF NOT EXISTS projects_artist_id_idx 
ON public.projects(artist_id);

-- 복합 인덱스 (아티스트별 상태별 조회) - status 컬럼이 있는 경우에만 생성
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS projects_artist_id_status_idx 
    ON public.projects(artist_id, status);
  END IF;
END $$;

-- 복합 인덱스 (아티스트별 생성일시 정렬)
CREATE INDEX IF NOT EXISTS projects_artist_id_created_at_idx 
ON public.projects(artist_id, created_at DESC);

-- 기존 RLS 정책 삭제 (아티스트 기반으로 재설정)
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- 새로운 RLS 정책: 사용자는 자신이 소유한 아티스트의 프로젝트를 읽을 수 있음
CREATE POLICY "Users can view own artists projects"
  ON public.projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.artists
      WHERE artists.id = projects.artist_id
      AND artists.user_id = auth.uid()
    )
  );

-- 새로운 RLS 정책: 사용자는 자신이 소유한 아티스트의 프로젝트를 생성할 수 있음
CREATE POLICY "Users can insert own artists projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artists
      WHERE artists.id = projects.artist_id
      AND artists.user_id = auth.uid()
    )
  );

-- 새로운 RLS 정책: 사용자는 자신이 소유한 아티스트의 프로젝트를 업데이트할 수 있음
CREATE POLICY "Users can update own artists projects"
  ON public.projects
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.artists
      WHERE artists.id = projects.artist_id
      AND artists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artists
      WHERE artists.id = projects.artist_id
      AND artists.user_id = auth.uid()
    )
  );

-- 새로운 RLS 정책: 사용자는 자신이 소유한 아티스트의 프로젝트를 삭제할 수 있음
CREATE POLICY "Users can delete own artists projects"
  ON public.projects
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.artists
      WHERE artists.id = projects.artist_id
      AND artists.user_id = auth.uid()
    )
  );

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.projects.artist_id IS '아티스트 ID (artists 테이블 참조, 프로젝트가 귀속된 아티스트)';

