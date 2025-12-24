-- ============================================
-- Supabase Storage 버킷 RLS 정책 설정
-- avatars 버킷에 대한 업로드/읽기/삭제 권한 설정
-- ============================================
--
-- ⚠️ 주의: 이 마이그레이션은 Service Role 권한이 필요합니다.
-- 일반적으로 Supabase Dashboard의 Storage > Policies UI에서 설정하는 것이 권장됩니다.
-- 자세한 내용은 STORAGE_RLS_SETUP.md 파일을 참조하세요.
--
-- Storage 버킷의 RLS 정책은 storage.objects 테이블에 대해 설정됩니다.
-- 버킷 이름은 'avatars'입니다.

-- 기존 정책 삭제 (중복 방지)
-- 주의: Service Role 권한이 필요할 수 있습니다.
DROP POLICY IF EXISTS "Users can upload own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own artist images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own cover images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;

-- 정책 1: 사용자는 자신의 프로필 이미지를 업로드할 수 있음
-- 경로 패턴: profile-images/{user_id}-{timestamp}.{ext}
CREATE POLICY "Users can upload own profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE 'profile-images/' || auth.uid()::text || '-%'
);

-- 정책 2: 사용자는 자신의 아티스트 이미지를 업로드할 수 있음
-- 경로 패턴: artist-images/artist-{user_id}-{timestamp}.{ext}
CREATE POLICY "Users can upload own artist images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
);

-- 정책 2-1: 사용자는 자신의 커버 이미지를 업로드할 수 있음
-- 경로 패턴: cover-images/artist-{user_id}-{timestamp}.{ext}
CREATE POLICY "Users can upload own cover images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
);

-- 정책 3: 사용자는 자신의 이미지를 읽을 수 있음
-- 프로필 이미지: profile-images/{user_id}-...
-- 아티스트 이미지: artist-images/artist-{user_id}-...
-- 커버 이미지: cover-images/artist-{user_id}-...
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

-- 정책 4: 공개 읽기 권한 (이미지 URL 공유를 위해)
-- 모든 사용자가 avatars 버킷의 이미지를 읽을 수 있음
CREATE POLICY "Public can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 정책 5: 사용자는 자신의 이미지를 삭제할 수 있음
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

-- 정책 6: 사용자는 자신의 이미지를 업데이트할 수 있음
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

COMMENT ON POLICY "Users can upload own profile images" ON storage.objects IS 
  '인증된 사용자는 자신의 프로필 이미지를 업로드할 수 있습니다 (경로: profile-images/{user_id}-...)';

COMMENT ON POLICY "Users can upload own artist images" ON storage.objects IS 
  '인증된 사용자는 자신의 아티스트 이미지를 업로드할 수 있습니다 (경로: artist-images/artist-{user_id}-...)';

COMMENT ON POLICY "Users can upload own cover images" ON storage.objects IS 
  '인증된 사용자는 자신의 커버 이미지를 업로드할 수 있습니다 (경로: cover-images/artist-{user_id}-...)';

COMMENT ON POLICY "Users can view own images" ON storage.objects IS 
  '인증된 사용자는 자신의 이미지를 읽을 수 있습니다';

COMMENT ON POLICY "Public can view images" ON storage.objects IS 
  '모든 사용자(인증되지 않은 사용자 포함)가 avatars 버킷의 이미지를 읽을 수 있습니다';

COMMENT ON POLICY "Users can delete own images" ON storage.objects IS 
  '인증된 사용자는 자신의 이미지를 삭제할 수 있습니다';

COMMENT ON POLICY "Users can update own images" ON storage.objects IS 
  '인증된 사용자는 자신의 이미지를 업데이트할 수 있습니다';

