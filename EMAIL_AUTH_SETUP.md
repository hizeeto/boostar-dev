# 이메일 인증 설정 가이드

이 문서는 Boostar 프로젝트에서 이메일 인증 기능을 완벽하게 설정하는 방법을 안내합니다.

## 📧 Supabase 이메일 인증 설정

### 1. Supabase Dashboard에서 이메일 인증 활성화

1. [Supabase Dashboard](https://app.supabase.com)에 접속
2. 프로젝트 선택
3. **Authentication** > **Providers** 메뉴로 이동
4. **Email** 프로바이더 확인:
   - ✅ **Enable Email provider** 체크박스가 활성화되어 있는지 확인
   - ✅ **Confirm email** 설정 확인 (이메일 인증 필요 여부)

### 2. 이메일 리다이렉트 URL 설정

1. **Authentication** > **URL Configuration** 메뉴로 이동
2. **Redirect URLs** 섹션에서 다음 URL 추가:
   ```
   http://localhost:3000/auth/callback
   https://your-domain.com/auth/callback
   ```
   - 개발 환경: `http://localhost:3000/auth/callback`
   - 프로덕션 환경: `https://your-actual-domain.com/auth/callback`

3. **Site URL** 설정:
   - 개발: `http://localhost:3000`
   - 프로덕션: `https://your-actual-domain.com`

### 3. 이메일 템플릿 커스터마이징 (선택사항)

1. **Authentication** > **Email Templates** 메뉴로 이동
2. **Confirm signup** 템플릿 선택
3. 이메일 내용 커스터마이징:
   - 기본적으로 `{{ .ConfirmationURL }}` 링크가 포함됨
   - 이 링크를 클릭하면 `/auth/callback`으로 리다이렉트됨

**예시 이메일 템플릿:**
```
안녕하세요!

Boostar 계정 생성을 완료하려면 아래 링크를 클릭해주세요:

{{ .ConfirmationURL }}

이 링크는 24시간 동안 유효합니다.

감사합니다.
Boostar 팀
```

### 4. 이메일 인증 설정 확인

**Authentication** > **Settings** 메뉴에서:

- ✅ **Enable email confirmations**: 이메일 인증 활성화 여부
- ✅ **Secure email change**: 이메일 변경 시 인증 필요
- ✅ **Double opt-in**: 이중 확인 (선택사항)

## 🔧 환경 변수 확인

`.env.local` 파일에 다음 변수가 설정되어 있는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🧪 테스트 방법

### 1. 회원가입 테스트

1. `/signup` 페이지에서 회원가입
2. 입력한 이메일 주소로 인증 메일 확인
3. 이메일의 인증 링크 클릭
4. `/auth/callback`으로 리다이렉트되는지 확인
5. 자동으로 로그인되고 `/onboarding`으로 이동하는지 확인

### 2. 이메일 인증 링크 형식 확인

이메일 인증 링크는 다음과 같은 형식이어야 합니다:
```
https://your-project-id.supabase.co/auth/v1/verify?token=xxx&type=email&redirect_to=http://localhost:3000/auth/callback#access_token=xxx&refresh_token=xxx
```

### 3. 콘솔 로그 확인

브라우저 개발자 도구 콘솔에서 다음을 확인:
- 인증 콜백 처리 로그
- 에러 메시지 (있는 경우)
- 세션 설정 성공 여부

## 🐛 문제 해결

### 문제 1: 이메일이 전송되지 않음

**해결 방법:**
1. Supabase Dashboard > **Authentication** > **Providers** > **Email** 확인
2. 이메일 프로바이더가 활성화되어 있는지 확인
3. Supabase의 이메일 전송 한도 확인 (무료 플랜은 제한이 있을 수 있음)
4. 스팸 폴더 확인

### 문제 2: "invalid request: both auth code and code verifier should be non-empty" 오류

**해결 방법:**
- 이미 해결됨: 인증 콜백 페이지에서 PKCE 플로우를 사용하지 않도록 수정됨
- 해시에서 직접 토큰을 추출하여 세션 설정

### 문제 3: 인증 링크 클릭 후 로그인되지 않음

**해결 방법:**
1. Supabase Dashboard에서 **Redirect URLs** 설정 확인
2. `emailRedirectTo` URL이 올바른지 확인
3. 브라우저 콘솔에서 에러 메시지 확인
4. 쿠키 설정 확인 (SameSite, Secure 등)

### 문제 4: 인증 링크가 만료됨

**해결 방법:**
1. Supabase Dashboard > **Authentication** > **Settings**에서 토큰 만료 시간 확인
2. 기본값은 24시간이지만 변경 가능
3. 만료된 링크의 경우 새로운 인증 링크 요청 필요

### 문제 5: 인증 후 온보딩으로 이동하지 않음

**해결 방법:**
1. 프로필 테이블의 `onboarding_completed` 필드 확인
2. 인증 콜백 페이지의 리다이렉트 로직 확인
3. 미들웨어에서 온보딩 페이지 접근 권한 확인

## 📝 주요 파일

- `src/app/auth/callback/page.tsx` - 이메일 인증 콜백 처리 페이지
- `src/components/signup-form.tsx` - 회원가입 폼 (이메일 인증 링크 발송)
- `src/lib/supabase/middleware.ts` - 세션 관리 미들웨어

## 🔐 보안 고려사항

1. **HTTPS 사용**: 프로덕션 환경에서는 반드시 HTTPS 사용
2. **리다이렉트 URL 화이트리스트**: Supabase Dashboard에서 허용된 URL만 설정
3. **토큰 만료 시간**: 적절한 만료 시간 설정 (기본 24시간)
4. **이메일 인증 필수**: 중요한 기능의 경우 이메일 인증을 필수로 설정

## 📚 추가 리소스

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Next.js Authentication](https://nextjs.org/docs/authentication)

