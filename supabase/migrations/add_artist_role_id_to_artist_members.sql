-- ============================================
-- 아티스트 멤버 테이블에 역할 ID 필드 추가
-- 멤버에게 아티스트 역할을 할당할 수 있도록 함
-- ============================================

-- artist_members 테이블에 artist_role_id 컬럼 추가
ALTER TABLE public.artist_members
ADD COLUMN IF NOT EXISTS artist_role_id UUID REFERENCES public.artist_roles(id) ON DELETE SET NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS artist_members_artist_role_id_idx 
ON public.artist_members(artist_role_id);

-- 컬럼 코멘트
COMMENT ON COLUMN public.artist_members.artist_role_id IS '멤버에게 할당된 아티스트 역할 ID (artist_roles 테이블 참조)';

