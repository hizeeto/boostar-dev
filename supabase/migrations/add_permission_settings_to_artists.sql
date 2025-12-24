-- ============================================
-- 아티스트 권한 설정 필드 추가
-- 각 권한 레벨별로 허용할 기능을 설정할 수 있도록 함
-- ============================================

-- artists 테이블에 permission_settings JSONB 필드 추가
ALTER TABLE public.artists
ADD COLUMN IF NOT EXISTS permission_settings JSONB DEFAULT '{
  "관리자": {
    "프로젝트_생성": true,
    "프로젝트_편집": true,
    "프로젝트_삭제": false,
    "멤버_초대": true,
    "멤버_제거": false,
    "역할_관리": true,
    "권한_관리": false,
    "프로필_편집": true
  },
  "멤버": {
    "프로젝트_생성": false,
    "프로젝트_편집": false,
    "프로젝트_삭제": false,
    "멤버_초대": false,
    "멤버_제거": false,
    "역할_관리": false,
    "권한_관리": false,
    "프로필_편집": false
  }
}'::jsonb;

-- 인덱스 생성 (JSONB 쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS artists_permission_settings_idx 
ON public.artists USING GIN (permission_settings);

-- 컬럼 코멘트
COMMENT ON COLUMN public.artists.permission_settings IS '권한 레벨별 기능 허용 설정 (JSONB)';

