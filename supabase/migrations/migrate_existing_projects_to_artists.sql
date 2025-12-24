-- ============================================
-- 기존 프로젝트를 아티스트에 연결하는 마이그레이션
-- 기존 사용자들에게 기본 아티스트를 생성하고 프로젝트를 연결
-- ============================================

-- 1. 기존 사용자들에게 기본 아티스트 생성
-- profiles 테이블의 nickname 또는 full_name을 사용하여 기본 아티스트 이름 설정
INSERT INTO public.artists (user_id, name, description, is_default, sort_order)
SELECT DISTINCT
  p.id as user_id,
  COALESCE(
    NULLIF(p.nickname, ''),
    NULLIF(p.full_name, ''),
    '내 아티스트'
  ) as name,
  '기본 아티스트' as description,
  true as is_default,
  0 as sort_order
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.artists a
  WHERE a.user_id = p.id
)
ON CONFLICT DO NOTHING;

-- 2. 기존 프로젝트들을 각 사용자의 기본 아티스트에 연결
UPDATE public.projects p
SET artist_id = (
  SELECT a.id
  FROM public.artists a
  WHERE a.user_id = p.owner_id
    AND a.is_default = true
  LIMIT 1
)
WHERE p.artist_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.artists a
    WHERE a.user_id = p.owner_id
      AND a.is_default = true
  );

-- 3. artist_id가 NULL인 프로젝트가 있는지 확인 (경고)
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM public.projects
  WHERE artist_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE WARNING '아티스트에 연결되지 않은 프로젝트가 %개 있습니다. 수동으로 연결해주세요.', null_count;
  ELSE
    RAISE NOTICE '모든 프로젝트가 아티스트에 성공적으로 연결되었습니다.';
  END IF;
END $$;

-- 4. artist_id를 NOT NULL로 변경 (모든 프로젝트가 연결된 후)
DO $$
BEGIN
  -- NULL인 프로젝트가 없으면 NOT NULL 제약조건 추가
  IF NOT EXISTS (
    SELECT 1 FROM public.projects WHERE artist_id IS NULL
  ) THEN
    ALTER TABLE public.projects
    ALTER COLUMN artist_id SET NOT NULL;
    
    RAISE NOTICE 'artist_id 컬럼에 NOT NULL 제약조건이 추가되었습니다.';
  ELSE
    RAISE WARNING 'NULL인 프로젝트가 있어 NOT NULL 제약조건을 추가할 수 없습니다.';
  END IF;
END $$;

