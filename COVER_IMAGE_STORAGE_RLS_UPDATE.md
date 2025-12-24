# 커버 이미지 Storage RLS 정책 업데이트 가이드

커버 이미지 관련 Storage RLS 정책을 업데이트하는 방법입니다.

## 사전 확인

현재 DB 상태:
- ✅ `artists` 테이블에 `cover_image_url` 컬럼 존재
- ✅ cleanup 함수에 커버 이미지 삭제 로직 추가됨

## 작업 1: Storage RLS 정책 업데이트

### 방법 1: SQL Editor에서 실행 (권장)

1. Supabase Dashboard > SQL Editor로 이동
2. `supabase/migrations/update_cover_image_storage_rls_complete.sql` 파일의 내용을 복사
3. SQL Editor에 붙여넣고 실행
4. Service Role 권한이 필요할 수 있습니다

### 방법 2: Storage Policies UI에서 수동 설정

Supabase Dashboard > Storage > Policies > avatars 버킷에서 다음 정책들을 확인/수정:

#### 정책 1: Users can upload own cover images (INSERT)
- **Policy name**: `Users can upload own cover images`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **WITH CHECK expression**:
  ```sql
  bucket_id = 'avatars' AND
  name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
  ```

#### 정책 2: Users can view own images (SELECT)
- **Policy name**: `Users can view own images`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'avatars' AND
  (
    name LIKE 'profile-images/' || auth.uid()::text || '-%'
    OR
    name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
    OR
    name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
  )
  ```

#### 정책 3: Public can view images (SELECT)
- **Policy name**: `Public can view images`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **USING expression**:
  ```sql
  bucket_id = 'avatars'
  ```

#### 정책 4: Users can delete own images (DELETE)
- **Policy name**: `Users can delete own images`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'avatars' AND
  (
    name LIKE 'profile-images/' || auth.uid()::text || '-%'
    OR
    name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
    OR
    name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
  )
  ```

#### 정책 5: Users can update own images (UPDATE)
- **Policy name**: `Users can update own images`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'avatars' AND
  (
    name LIKE 'profile-images/' || auth.uid()::text || '-%'
    OR
    name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
    OR
    name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
  )
  ```
- **WITH CHECK expression** (동일):
  ```sql
  bucket_id = 'avatars' AND
  (
    name LIKE 'profile-images/' || auth.uid()::text || '-%'
    OR
    name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
    OR
    name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
  )
  ```

## 완료 확인

모든 정책이 올바르게 설정되었는지 확인:

1. Supabase Dashboard > Storage > Policies > avatars 버킷
2. 다음 정책들이 모두 있는지 확인:
   - ✅ `Users can upload own profile images` (INSERT)
   - ✅ `Users can upload own artist images` (INSERT)
   - ✅ `Users can upload own cover images` (INSERT)
   - ✅ `Users can view own images` (SELECT) - 커버 이미지 경로 포함
   - ✅ `Public can view images` (SELECT)
   - ✅ `Users can delete own images` (DELETE) - 커버 이미지 경로 포함
   - ✅ `Users can update own images` (UPDATE) - 커버 이미지 경로 포함

## 테스트

애플리케이션에서 커버 이미지 업로드/삭제/수정 기능을 테스트하여 정책이 올바르게 작동하는지 확인하세요.

## 참고사항

- 정책을 수정한 후 즉시 적용됩니다
- 정책이 제대로 작동하지 않으면 브라우저를 새로고침하거나 잠시 기다려보세요
- 여전히 오류가 발생하면 정책의 SQL 구문을 다시 확인하세요
- Service Role 권한이 필요한 작업은 SQL Editor에서 실행하거나 Dashboard UI를 사용하세요

