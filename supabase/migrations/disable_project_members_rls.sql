-- 프로젝트 멤버 테이블 RLS 해제
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;

-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can insert project members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can update project members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can delete project members" ON public.project_members;

