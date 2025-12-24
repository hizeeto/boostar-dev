-- ============================================
-- 프로젝트 캘린더 이벤트 테이블 생성
-- ============================================

-- project_calendar_events 테이블 생성
CREATE TABLE IF NOT EXISTS public.project_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 프로젝트 참조
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- 이벤트 제목
  title TEXT NOT NULL,
  
  -- 이벤트 설명
  description TEXT,
  
  -- 이벤트 날짜 및 시간
  event_date DATE NOT NULL,
  event_time TIME,
  
  -- 이벤트 종료 시간 (선택사항)
  end_time TIME,
  
  -- 전체 일정 여부
  is_all_day BOOLEAN DEFAULT false,
  
  -- 생성자 정보
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS project_calendar_events_project_id_idx 
ON public.project_calendar_events(project_id);

CREATE INDEX IF NOT EXISTS project_calendar_events_event_date_idx 
ON public.project_calendar_events(event_date);

CREATE INDEX IF NOT EXISTS project_calendar_events_created_at_idx 
ON public.project_calendar_events(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_project_calendar_events_updated_at
  BEFORE UPDATE ON public.project_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE public.project_calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 프로젝트 멤버는 이벤트를 볼 수 있음
DROP POLICY IF EXISTS "Project members can view calendar events" ON public.project_calendar_events;
CREATE POLICY "Project members can view calendar events"
  ON public.project_calendar_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_calendar_events.project_id
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

-- RLS 정책: 프로젝트 멤버는 이벤트를 생성할 수 있음
DROP POLICY IF EXISTS "Project members can create calendar events" ON public.project_calendar_events;
CREATE POLICY "Project members can create calendar events"
  ON public.project_calendar_events
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_calendar_events.project_id
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

-- RLS 정책: 생성자는 자신의 이벤트를 수정할 수 있음
DROP POLICY IF EXISTS "Creators can update own calendar events" ON public.project_calendar_events;
CREATE POLICY "Creators can update own calendar events"
  ON public.project_calendar_events
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- RLS 정책: 생성자는 자신의 이벤트를 삭제할 수 있음
DROP POLICY IF EXISTS "Creators can delete own calendar events" ON public.project_calendar_events;
CREATE POLICY "Creators can delete own calendar events"
  ON public.project_calendar_events
  FOR DELETE
  USING (auth.uid() = created_by);

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE public.project_calendar_events IS '프로젝트 캘린더 이벤트 테이블';
COMMENT ON COLUMN public.project_calendar_events.is_all_day IS '전체 일정 여부 (true: 종일, false: 시간 지정)';

