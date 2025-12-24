# Supabase Storage RLS 정책 설정 가이드

## 문제
`storage.objects` 테이블에 직접 정책을 생성하려고 하면 "must be owner of relation objects" 오류가 발생합니다.
이는 Supabase Storage의 RLS 정책이 일반 SQL로는 설정할 수 없기 때문입니다.

## 해결 방법: Supabase Dashboard에서 설정

### 방법 1: Storage Policies UI 사용 (권장)

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Storage** 클릭
4. `avatars` 버킷을 찾아 클릭
5. **Policies** 탭 클릭
6. **New Policy** 버튼 클릭

#### 정책 1: 프로필 이미지 업로드 허용

- **Policy name**: `Users can upload own profile images`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'avatars' AND
name LIKE 'profile-images/' || auth.uid()::text || '-%'
```

#### 정책 2: 아티스트 이미지 업로드 허용

- **Policy name**: `Users can upload own artist images`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'avatars' AND
name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
```

#### 정책 3: 자신의 이미지 읽기 허용

- **Policy name**: `Users can view own images`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'avatars' AND
(
  name LIKE 'profile-images/' || auth.uid()::text || '-%'
  OR
  name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
)
```

#### 정책 4: 공개 읽기 허용 (이미지 URL 공유용)

- **Policy name**: `Public can view images`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**:
```sql
bucket_id = 'avatars'
```

#### 정책 5: 자신의 이미지 삭제 허용

- **Policy name**: `Users can delete own images`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'avatars' AND
(
  name LIKE 'profile-images/' || auth.uid()::text || '-%'
  OR
  name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
)
```

#### 정책 6: 자신의 이미지 업데이트 허용

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
)
```
- **WITH CHECK expression**:
```sql
bucket_id = 'avatars' AND
(
  name LIKE 'profile-images/' || auth.uid()::text || '-%'
  OR
  name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
)
```

### 방법 2: SQL Editor에서 Service Role로 실행

만약 Service Role Key를 사용할 수 있다면, SQL Editor에서 다음을 실행할 수 있습니다:

1. Supabase Dashboard > **SQL Editor** 접속
2. 다음 SQL을 실행 (Service Role 권한 필요):

```sql
-- 프로필 이미지 업로드 정책
CREATE POLICY "Users can upload own profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE 'profile-images/' || auth.uid()::text || '-%'
);

-- 아티스트 이미지 업로드 정책
CREATE POLICY "Users can upload own artist images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
);

-- 자신의 이미지 읽기 정책
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
  )
);

-- 공개 읽기 정책
CREATE POLICY "Public can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 자신의 이미지 삭제 정책
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
  )
);

-- 자신의 이미지 업데이트 정책
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
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (
    name LIKE 'profile-images/' || auth.uid()::text || '-%'
    OR
    name LIKE 'artist-images/artist-' || auth.uid()::text || '-%'
  )
);
```

**주의**: SQL Editor에서 실행할 때도 Service Role 권한이 필요할 수 있습니다. 
만약 오류가 발생하면 **방법 1 (Storage Policies UI)**을 사용하세요.

## 확인

정책 설정 후, 아티스트 생성 시 이미지 업로드가 정상적으로 작동하는지 확인하세요.

