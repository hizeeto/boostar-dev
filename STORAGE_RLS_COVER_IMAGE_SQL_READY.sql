-- ============================================
-- 커버 이미지 Storage RLS 정책 추가
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================

-- 정책 1: 커버 이미지 업로드 정책 추가
DROP POLICY IF EXISTS "Users can upload own cover images" ON storage.objects;

CREATE POLICY "Users can upload own cover images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
);

-- 정책 2: 기존 "Users can view own images" 정책 업데이트
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;

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

-- 정책 3: 기존 "Users can delete own images" 정책 업데이트
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

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

-- 정책 4: 기존 "Users can update own images" 정책 업데이트
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;

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

