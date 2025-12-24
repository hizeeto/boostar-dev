# Supabase 연결 설정 가이드

## 환경 변수 설정

### 1. Supabase 프로젝트 생성
1. [Supabase Dashboard](https://app.supabase.com)에 접속
2. 새 프로젝트 생성
3. 프로젝트 설정에서 다음 정보 확인:
   - Project URL
   - API Keys (anon/public key)

### 2. .env.local 파일 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. 환경 변수 확인 방법

#### 방법 1: 테스트 페이지 사용
개발 서버 실행 후 브라우저에서 `/test-supabase` 페이지 접속:
```
http://localhost:3000/test-supabase
```

#### 방법 2: API 엔드포인트 사용
```bash
curl http://localhost:3000/api/supabase-test
```

## 연결 테스트

### 클라이언트 사이드
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data, error } = await supabase.auth.getSession()
```

### 서버 사이드
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data, error } = await supabase.auth.getUser()
```

### 환경 변수 검증
```typescript
import { checkSupabaseConfig } from '@/lib/supabase/health-check'

const health = checkSupabaseConfig()
if (!health.connected) {
  console.error(health.message)
}
```

## 문제 해결

### 환경 변수가 인식되지 않는 경우
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일 이름이 정확한지 확인 (`.env.local` - 점으로 시작)
3. 개발 서버를 재시작
4. 환경 변수 이름이 `NEXT_PUBLIC_`로 시작하는지 확인

### 연결 오류가 발생하는 경우
1. Supabase 프로젝트가 활성화되어 있는지 확인
2. URL 형식이 올바른지 확인 (`https://xxx.supabase.co`)
3. Anon Key가 올바른지 확인
4. 네트워크 연결 확인
5. Supabase 프로젝트의 API 설정 확인

### CORS 오류
- Supabase Dashboard에서 API 설정 확인
- Allowed origins에 로컬 개발 URL 추가 (`http://localhost:3000`)

## 주요 파일

- `src/lib/supabase/client.ts` - 클라이언트 사이드 클라이언트
- `src/lib/supabase/server.ts` - 서버 사이드 클라이언트
- `src/lib/supabase/middleware.ts` - 미들웨어 세션 관리
- `src/lib/supabase/health-check.ts` - 연결 상태 확인 유틸리티
- `src/app/test-supabase/page.tsx` - 연결 테스트 페이지
- `src/app/api/supabase-test/route.ts` - 서버 사이드 테스트 API

## 다음 단계

1. 인증 설정: Supabase Dashboard에서 인증 프로바이더 설정
2. **이메일 인증 설정**: `EMAIL_AUTH_SETUP.md` 파일 참조
3. 데이터베이스 스키마 생성: SQL Editor에서 테이블 생성
4. Row Level Security (RLS) 설정: 보안 정책 구성
5. 스토리지 설정: 파일 업로드 기능 구현

## 이메일 인증 설정

이메일 인증 기능을 완벽하게 설정하려면 `EMAIL_AUTH_SETUP.md` 파일을 참조하세요.

주요 설정 사항:
- Supabase Dashboard에서 이메일 인증 활성화
- 리다이렉트 URL 설정 (`/auth/callback`)
- 이메일 템플릿 커스터마이징 (선택사항)

