# 커버 이미지 Storage RLS 정책 설정 가이드

Supabase Dashboard UI를 사용하여 커버 이미지 관련 Storage RLS 정책을 설정하는 방법입니다.

## 사전 준비

1. Supabase Dashboard에 로그인
2. 프로젝트 선택
3. 좌측 메뉴에서 **Storage** 클릭
4. **Policies** 탭 선택
5. **avatars** 버킷 선택

---

## 작업 1: 커버 이미지 업로드 정책 추가

### 단계별 설정

1. **"New Policy"** 버튼 클릭
2. **Policy name**: `Users can upload own cover images`
3. **Allowed operation**: `INSERT` 선택
4. **Target roles**: `authenticated` 선택
5. **USING expression**: (비워두기 - 빈 칸)
6. **WITH CHECK expression**: 아래 코드 복사하여 붙여넣기
   ```sql
   bucket_id = 'avatars' AND
   name LIKE 'cover-images/artist-' || auth.uid()::text || '-%'
   ```
7. **"Review"** 클릭하여 확인
8. **"Save policy"** 클릭

---

## 작업 2: 기존 정책 업데이트 (3개)

다음 3개의 기존 정책을 찾아서 편집해야 합니다:
- `Users can view own images` (SELECT)
- `Users can delete own images` (DELETE)
- `Users can update own images` (UPDATE)

각 정책의 **USING expression**과 **WITH CHECK expression**에 커버 이미지 경로를 추가해야 합니다.

### 정책 2-1: "Users can view own images" 업데이트

1. 정책 목록에서 **"Users can view own images"** 찾기
2. 정책 옆 **"Edit"** (연필 아이콘) 클릭
3. **USING expression**을 아래 코드로 교체:
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
4. **"Save policy"** 클릭

### 정책 2-2: "Users can delete own images" 업데이트

1. 정책 목록에서 **"Users can delete own images"** 찾기
2. 정책 옆 **"Edit"** (연필 아이콘) 클릭
3. **USING expression**을 아래 코드로 교체:
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
4. **"Save policy"** 클릭

### 정책 2-3: "Users can update own images" 업데이트

1. 정책 목록에서 **"Users can update own images"** 찾기
2. 정책 옆 **"Edit"** (연필 아이콘) 클릭
3. **USING expression**을 아래 코드로 교체:
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
4. **WITH CHECK expression**도 동일하게 아래 코드로 교체:
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
5. **"Save policy"** 클릭

---

## 완료 확인

모든 정책 설정이 완료되면:

1. 정책 목록에서 다음 4개 정책이 모두 있는지 확인:
   - ✅ `Users can upload own cover images` (INSERT)
   - ✅ `Users can view own images` (SELECT) - 커버 이미지 경로 포함
   - ✅ `Users can delete own images` (DELETE) - 커버 이미지 경로 포함
   - ✅ `Users can update own images` (UPDATE) - 커버 이미지 경로 포함

2. 애플리케이션에서 커버 이미지 업로드 테스트

---

## 참고사항

- 정책을 수정한 후 즉시 적용됩니다
- 정책이 제대로 작동하지 않으면 브라우저를 새로고침하거나 잠시 기다려보세요
- 여전히 오류가 발생하면 정책의 SQL 구문을 다시 확인하세요

