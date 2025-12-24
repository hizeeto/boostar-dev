-- ============================================
-- 커버 이미지 Storage RLS 정책 완전 업데이트
-- 기존 정책 정리 및 커버 이미지 지원 추가
-- ============================================
--
-- ⚠️ 주의사항:
-- 이 스크립트는 Service Role 권한이 필요합니다.
-- Supabase Dashboard의 SQL Editor에서 Service Role 키로 실행하거나
-- Supabase Dashboard > Storage > Policies UI에서 수동으로 설정하세요.
--
-- 실행 방법:
-- 1. Supabase Dashboard > SQL Editor로 이동
-- 2. 이 스크립트를 붙여넣고 실행
-- 3. 또는 Storage > Policies UI에서 수동으로 정책 설정
--

-- 기존 중복/잘못된 정책 삭제
DROP POLICY IF EXISTS "Users can upload own cover images 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;

-- 정책 1: 사용자는 자신의 프로필 이미지를 업로드할 수 있음
DROP POLICY IF EXISTS "Users can upload own profile images" ON storage.objects;
CREATE POLICY "Users can upload own profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE 'profile-images/' || auth.uid()::text || '-%'
);

-- 정책 2: 사용자는 자신의 아티스트 이미지를 업로드할 수 있음
DROP POLICY IF EXISTS "Users can upload own artist images" ON storage.objects;
CREATE POLICY "Users can upload own artist images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
);

-- 정책 3: 사용자는 자신의 커버 이미지를 업로드할 수 있음
CREATE POLICY "Users can upload own cover images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
);

-- 정책 4: 사용자는 자신의 이미지를 읽을 수 있음
CREATE POLICY "Users can view own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (
    name LIKE 'profile-images/' || auth.uid()::text || '-%'
    OR
    name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
    OR
    name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
  )
);

-- 정책 5: 공개 읽기 권한 (이미지 URL 공유를 위해)
-- 모든 사용자(인증되지 않은 사용자 포함)가 avatars 버킷의 이미지를 읽을 수 있음
CREATE POLICY "Public can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 정책 6: 사용자는 자신의 이미지를 삭제할 수 있음
DROP POLICY IF EXISTS "인증된 사용자는 자신의 프로필 이미지 삭제 가" ON storage.objects;
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (
    name LIKE 'profile-images/' || auth.uid()::text || '-%'
    OR
    name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
    OR
    name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
  )
);

-- 정책 7: 사용자는 자신의 이미지를 업데이트할 수 있음
CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (
    name LIKE 'profile-images/' || auth.uid()::text || '-%'
    OR
    name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
    OR
    name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (
    name LIKE 'profile-images/' || auth.uid()::text || '-%'
    OR
    name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
    OR
    name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
  )
);

-- 정책 코멘트 추가
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

