-- ============================================
-- 프로젝트 피드 테이블 생성
-- ============================================

-- project_feeds 테이블 생성
CREATE TABLE IF NOT EXISTS public.project_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 프로젝트 참조
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- 피드 타입 (announcement, workflow, release, calendar, library, member, settings)
  feed_type TEXT NOT NULL CHECK (feed_type IN ('announcement', 'workflow', 'release', 'calendar', 'library', 'member', 'settings')),
  
  -- 피드 제목
  title TEXT NOT NULL,
  
  -- 피드 내용
  content TEXT,
  
  -- 작성자 정보
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 메타데이터 (JSON 형식으로 추가 정보 저장)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS project_feeds_project_id_idx 
ON public.project_feeds(project_id);

CREATE INDEX IF NOT EXISTS project_feeds_feed_type_idx 
ON public.project_feeds(feed_type);

CREATE INDEX IF NOT EXISTS project_feeds_created_at_idx 
ON public.project_feeds(created_at DESC);

CREATE INDEX IF NOT EXISTS project_feeds_author_id_idx 
ON public.project_feeds(author_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_project_feeds_updated_at
  BEFORE UPDATE ON public.project_feeds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE public.project_feeds ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 프로젝트 멤버는 피드를 볼 수 있음
DROP POLICY IF EXISTS "Project members can view feeds" ON public.project_feeds;
CREATE POLICY "Project members can view feeds"
  ON public.project_feeds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_feeds.project_id
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.artist_members
          WHERE artist_members.artist_id = projects.artist_id
          AND artist_members.user_id = auth.uid()
        )
      )
    )
  );

-- RLS 정책: 프로젝트 멤버는 피드를 생성할 수 있음
DROP POLICY IF EXISTS "Project members can create feeds" ON public.project_feeds;
CREATE POLICY "Project members can create feeds"
  ON public.project_feeds
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_feeds.project_id
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.artist_members
          WHERE artist_members.artist_id = projects.artist_id
          AND artist_members.user_id = auth.uid()
        )
      )
    )
  );

-- RLS 정책: 작성자는 자신의 피드를 수정할 수 있음
DROP POLICY IF EXISTS "Authors can update own feeds" ON public.project_feeds;
CREATE POLICY "Authors can update own feeds"
  ON public.project_feeds
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- RLS 정책: 작성자는 자신의 피드를 삭제할 수 있음
DROP POLICY IF EXISTS "Authors can delete own feeds" ON public.project_feeds;
CREATE POLICY "Authors can delete own feeds"
  ON public.project_feeds
  FOR DELETE
  USING (auth.uid() = author_id);

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE public.project_feeds IS '프로젝트 피드 테이블';
COMMENT ON COLUMN public.project_feeds.feed_type IS '피드 타입 (announcement: 공지, workflow: 워크플로우, release: 릴리즈, calendar: 캘린더, library: 라이브러리, member: 멤버, settings: 설정)';
COMMENT ON COLUMN public.project_feeds.metadata IS '추가 메타데이터 (JSON 형식)';

