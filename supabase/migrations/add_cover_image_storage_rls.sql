-- ============================================
-- 커버 이미지 Storage RLS 정책 추가
-- SQL 에디터에 직접 붙여넣어 실행 가능
-- ============================================
--
-- ⚠️ 주의사항:
-- 1. 이 스크립트는 Service Role 권한이 필요합니다.
-- 2. 일반적으로 Supabase Dashboard의 Storage > Policies UI에서 설정하는 것이 권장됩니다.
-- 3. SQL Editor에서 실행 시 권한 오류가 발생하면:
--    - Supabase Dashboard > Storage > Policies 메뉴에서 수동으로 정책을 추가하거나
--    - Service Role 키를 사용하여 실행하세요.
--
-- 방법 1: Supabase Dashboard UI 사용 (권장)
-- 1. Supabase Dashboard > Storage > Policies로 이동
-- 2. "avatars" 버킷 선택
-- 3. "New Policy" 클릭
-- 4. 아래 정책들을 하나씩 추가
--
-- 방법 2: SQL Editor에서 실행 (Service Role 권한 필요)
-- 이 스크립트를 SQL Editor에 붙여넣고 실행
--

-- 정책: 사용자는 자신의 커버 이미지를 업로드할 수 있음
-- 경로 패턴: cover-images/artist-{user_id}-{timestamp}.{ext}
DROP POLICY IF EXISTS "Users can upload own cover images" ON storage.objects;

CREATE POLICY "Users can upload own cover images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
);

-- 기존 정책 업데이트: 사용자는 자신의 이미지를 읽을 수 있음
-- 커버 이미지 경로 추가
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;

CREATE POLICY "Users can view own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (
    -- 프로필 이미지 경로 확인
    name LIKE 'profile-images/' || auth.uid()::text || '-%'
    OR
    -- 아티스트 이미지 경로 확인
    name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
    OR
    -- 커버 이미지 경로 확인
    name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
  )
);

-- 기존 정책 업데이트: 사용자는 자신의 이미지를 삭제할 수 있음
-- 커버 이미지 경로 추가
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (
    -- 프로필 이미지 경로 확인
    name LIKE 'profile-images/' || auth.uid()::text || '-%'
    OR
    -- 아티스트 이미지 경로 확인
    name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
    OR
    -- 커버 이미지 경로 확인
    name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
  )
);

-- 기존 정책 업데이트: 사용자는 자신의 이미지를 업데이트할 수 있음
-- 커버 이미지 경로 추가
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;

CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (
    -- 프로필 이미지 경로 확인
    name LIKE 'profile-images/' || auth.uid()::text || '-%'
    OR
    -- 아티스트 이미지 경로 확인
    name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
    OR
    -- 커버 이미지 경로 확인
    name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (
    -- 프로필 이미지 경로 확인
    name LIKE 'profile-images/' || auth.uid()::text || '-%'
    OR
    -- 아티스트 이미지 경로 확인
    name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
    OR
    -- 커버 이미지 경로 확인
    name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
  )
);

-- 정책 코멘트 추가
COMMENT ON POLICY "Users can upload own cover images" ON storage.objects IS 
  '인증된 사용자는 자신의 커버 이미지를 업로드할 수 있습니다 (경로: cover-images/artist-{user_id}-...)';

