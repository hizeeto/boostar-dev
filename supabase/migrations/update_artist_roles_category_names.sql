-- ============================================
-- 아티스트 역할 카테고리 이름 업데이트
-- "세션(역할 성격)" → "세션"
-- "참여 형태(멤버십 태그)" → "참여 형태"
-- ============================================

-- 카테고리 이름 업데이트
UPDATE public.artist_roles
SET category = '세션',
    updated_at = now()
WHERE category = '세션(역할 성격)';

UPDATE public.artist_roles
SET category = '참여 형태',
    updated_at = now()
WHERE category = '참여 형태(멤버십 태그)';

