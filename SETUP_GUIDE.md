# Boostar 설정 가이드

## 🚀 빠른 시작

### 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Supabase 키 찾는 방법:**
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. Settings > API
4. Project URL과 anon/public key 복사

### 2. Supabase 스토리지 버킷 생성

프로필 이미지 업로드를 위해 스토리지 버킷을 생성해야 합니다:

1. Supabase Dashboard에서 Storage 메뉴 선택
2. "Create a new bucket" 클릭
3. 버킷 이름: `avatars`
4. Public bucket: `true` (공개 접근 허용)
5. Create bucket 클릭

### 3. 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 📋 기능 설명

### 구현된 기능

1. **회원가입** (`/signup`)
   - 이메일/비밀번호로 가입
   - 비밀번호 강도 검증 (8자 이상, 대소문자, 숫자, 특수문자)
   - 서비스 이용 약관 및 개인정보 처리방침 동의
   - 마케팅 수신 동의 (선택)

2. **로그인** (`/login`)
   - 이메일/비밀번호로 로그인
   - 온보딩 완료 여부에 따라 자동 리다이렉트

3. **온보딩** (`/onboarding`)
   - 프로필 이미지 업로드
   - 닉네임 중복 확인
   - 휴대전화번호 인증
   - 기본 정보 입력 (이름, 성별, 주소)

4. **메인 페이지** (`/`)
   - 인증된 사용자만 접근 가능
   - 프로필 정보 표시
   - 로그아웃 기능

### 인증 플로우

```
회원가입 (/signup)
  ↓
이메일 인증 링크 발송
  ↓
이메일에서 링크 클릭 → /auth/callback
  ↓
세션 설정 및 자동 로그인
  ↓
온보딩 (/onboarding)
  ↓
메인 페이지 (/)
```

**로그인 시:**
- 온보딩 미완료 → `/onboarding`으로 리다이렉트
- 온보딩 완료 → `/`로 리다이렉트

**이메일 인증 설정:**
이메일 인증 기능을 완벽하게 설정하려면 `EMAIL_AUTH_SETUP.md` 파일을 참조하세요.

### 미들웨어 보호

다음 페이지들은 인증이 필요합니다:
- `/` (메인 페이지)
- `/onboarding` (온보딩)

다음 페이지들은 공개입니다:
- `/login` (로그인)
- `/signup` (회원가입)
- `/api/*` (API 라우트)

## 🗄️ 데이터베이스 스키마

### profiles 테이블

이미 생성되어 있는 테이블입니다:

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | 사용자 ID (auth.users와 연결) |
| email | text | 이메일 |
| nickname | text | 닉네임 |
| full_name | text | 이름 |
| phone | text | 휴대전화번호 |
| gender | text | 성별 (male/female) |
| avatar_url | text | 프로필 이미지 URL |
| address1 | text | 주소 |
| marketing_consent | boolean | 마케팅 수신 동의 |
| onboarding_completed | boolean | 온보딩 완료 여부 |
| onboarding_completed_at | timestamptz | 온보딩 완료 시간 |

## 🔧 문제 해결

### 환경 변수를 인식하지 못하는 경우
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 변수 이름이 `NEXT_PUBLIC_`로 시작하는지 확인
3. 개발 서버 재시작 (`Ctrl+C` 후 `npm run dev`)

### 로그인/회원가입이 작동하지 않는 경우
1. Supabase 프로젝트가 활성화되어 있는지 확인
2. URL과 Anon Key가 올바른지 확인
3. 브라우저 콘솔에서 오류 메시지 확인

### 프로필 이미지 업로드가 실패하는 경우
1. `avatars` 버킷이 생성되어 있는지 확인
2. 버킷이 Public으로 설정되어 있는지 확인
3. 파일 크기가 5MB 이하인지 확인
4. 지원 형식: jpg, jpeg, png, webp, avif, heic

### 휴대전화번호 인증이 작동하지 않는 경우
현재 휴대전화번호 인증은 모의(mock) 구현입니다.
실제 SMS 인증을 구현하려면:
1. SMS 서비스 API 연동 (예: Twilio, AWS SNS)
2. `/api/phone-verify` 라우트 수정 필요

## 📱 다음 단계

구현 필요한 기능:
- [ ] 실제 SMS 인증 구현
- [ ] 비밀번호 재설정 기능
- [ ] 프로필 수정 기능
- [ ] 소셜 로그인 (Google, Kakao 등)
- [ ] 이메일 인증 확인 페이지

## 💡 개발 팁

### Toast 알림 사용하기
```typescript
import { toast } from "sonner"

toast.success("성공 메시지")
toast.error("오류 메시지")
toast.info("안내 메시지")
```

### Supabase 클라이언트 사용하기
```typescript
// 클라이언트 컴포넌트에서
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()

// 서버 컴포넌트/API 라우트에서
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()
```

## 📚 참고 자료

- [Next.js 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [shadcn/ui 문서](https://ui.shadcn.com)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)

