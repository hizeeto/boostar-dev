-- projects 테이블에 시작일과 목표일 컬럼 추가
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS target_date DATE;

-- 시작일 인덱스 (날짜별 필터링 성능 향상)
CREATE INDEX IF NOT EXISTS projects_start_date_idx 
ON public.projects(start_date);

-- 목표일 인덱스 (날짜별 필터링 성능 향상)
CREATE INDEX IF NOT EXISTS projects_target_date_idx 
ON public.projects(target_date);

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.projects.start_date IS '프로젝트 시작일';
COMMENT ON COLUMN public.projects.target_date IS '프로젝트 목표일';

