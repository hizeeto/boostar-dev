# 세션 문제 해결 가이드

## 문제 상황

로그인 후 `/console` 페이지 접근 시 다음 오류 발생:
```
[getUserProfile] 세션이 없습니다. 로그인이 필요합니다.
[Middleware] {
  pathname: '/console',
  hasUser: false,
  userId: undefined,
  userEmail: undefined
}
```

## 원인

로그인 후 클라이언트에서 설정된 세션 쿠키가 서버로 전달되지 않음.

## 적용된 수정 사항

### 1. 클라이언트 쿠키 처리 개선 (`src/lib/supabase/client.ts`)

명시적인 쿠키 핸들러 추가:
- `get()`: 브라우저 쿠키 읽기
- `set()`: 브라우저 쿠키 설정 (로깅 포함)
- `remove()`: 브라우저 쿠키 삭제

### 2. 로그인 후 리다이렉트 방식 변경 (`src/components/login-form.tsx`)

```typescript
// 변경 전: router.push() + router.refresh()
router.push('/console')
router.refresh()

// 변경 후: window.location.href (전체 페이지 새로고침)
window.location.href = '/console'
```

**이유**: `window.location.href`를 사용하면 브라우저가 전체 페이지를 새로 로드하면서 쿠키를 서버로 확실히 전달합니다.

### 3. 세션 확인 대기 시간 추가

로그인 후 쿠키가 저장될 시간을 확보:
```typescript
await new Promise(resolve => setTimeout(resolve, 500))
```

### 4. 미들웨어 디버깅 로그 추가 (`src/lib/supabase/middleware.ts`)

요청 쿠키 정보 로깅:
```typescript
console.log('[Middleware] 요청 쿠키:', {
  total: requestCookies.length,
  authCookies: authCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
})
```

## 테스트 방법

### 1. 로그인 테스트

1. `/login` 페이지에서 로그인
2. 브라우저 개발자 도구 콘솔 확인:
   ```
   [로그인] 인증 성공: { userId: '...', email: '...', hasSession: true }
   [Supabase Client] 쿠키 설정: sb-...-auth-token 길이: ...
   [로그인] 콘솔 페이지로 이동
   ```

### 2. 미들웨어 로그 확인

서버 콘솔에서 확인:
```
[Middleware] 요청 쿠키: { total: X, authCookies: [...] }
[Middleware] { pathname: '/console', hasUser: true, userId: '...', userEmail: '...' }
```

### 3. 프로필 데이터 확인

서버 콘솔에서 확인:
```
[getUserProfile] 사용자 ID: ...
[getUserProfile] 사용자 이메일: ...
[getUserProfile] 프로필 데이터 조회 성공: { nickname: '...', ... }
```

### 4. API 엔드포인트로 세션 확인

```bash
# 로그인 후 브라우저에서 실행
curl http://localhost:3000/api/session-check
```

응답 예시:
```json
{
  "success": true,
  "data": {
    "cookies": {
      "total": 5,
      "supabase": [
        { "name": "sb-xxx-auth-token", "hasValue": true, "valueLength": 1234 }
      ]
    },
    "session": {
      "exists": true,
      "userId": "...",
      "email": "..."
    }
  }
}
```

## Profile DB 정보 매핑

Console 페이지의 nav-user 컴포넌트는 다음과 같이 profile DB 정보를 사용:

```typescript
// src/app/console/page.tsx
return {
  name: profile.nickname || profile.full_name || user.email?.split('@')[0] || 'User',
  email: profile.email || user.email || '',
  avatar: profile.avatar_url || '',
}
```

- **이름**: `nickname` (없으면 `full_name`, 없으면 이메일 앞부분)
- **이메일**: `email` (없으면 auth.user.email)
- **프로필 이미지**: `avatar_url` (없으면 빈 문자열 → AvatarFallback으로 이니셜 표시)

## 추가 디버깅 도구

### 세션 확인 API
- **경로**: `/api/session-check`
- **용도**: 서버에서 세션과 쿠키 상태 확인

### 프로필 테스트 API
- **경로**: `/api/profile-test`
- **용도**: 프로필 DB 조회 테스트

## 문제가 계속되는 경우

1. **브라우저 쿠키 확인**
   - 개발자 도구 > Application > Cookies
   - `sb-` 또는 `supabase`로 시작하는 쿠키 확인

2. **환경 변수 확인**
   ```bash
   # .env.local 파일 확인
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

3. **개발 서버 재시작**
   ```bash
   npm run dev
   ```

4. **브라우저 캐시 및 쿠키 삭제**
   - 개발자 도구 > Application > Clear storage

5. **Supabase 프로젝트 상태 확인**
   - [Supabase Dashboard](https://app.supabase.com)에서 프로젝트 활성화 확인
   - Auth 설정 확인

## 예상 동작

1. 사용자가 로그인
2. Supabase가 세션 토큰을 쿠키에 저장
3. 페이지 리다이렉트 (전체 새로고침)
4. 미들웨어가 쿠키에서 세션 읽기
5. Console 페이지가 세션에서 사용자 ID 가져오기
6. profiles 테이블에서 사용자 정보 조회
7. nav-user에 nickname, email, avatar_url 표시

