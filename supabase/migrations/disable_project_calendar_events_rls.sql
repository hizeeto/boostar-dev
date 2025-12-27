-- 프로젝트 캘린더 이벤트 테이블 RLS 해제
ALTER TABLE public.project_calendar_events DISABLE ROW LEVEL SECURITY;

-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Project members can view calendar events" ON public.project_calendar_events;
DROP POLICY IF EXISTS "Project members can create calendar events" ON public.project_calendar_events;
DROP POLICY IF EXISTS "Creators can update own calendar events" ON public.project_calendar_events;
DROP POLICY IF EXISTS "Creators can delete own calendar events" ON public.project_calendar_events;

