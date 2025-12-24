# Vercel 배포 가이드

이 가이드는 Boostar 프로젝트를 Vercel에 배포하는 방법을 설명합니다.

## 사전 준비사항

### 1. Supabase 프로젝트 설정
배포 전에 Supabase 프로젝트가 프로덕션 준비가 되어 있는지 확인하세요:
- RLS (Row Level Security) 정책이 모든 테이블에 적용되어 있는지 확인
- Storage 버킷의 RLS 정책 확인
- 필요한 모든 마이그레이션이 실행되었는지 확인

### 2. 환경 변수 준비
`.env.example` 파일을 참고하여 다음 환경 변수를 준비하세요:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Vercel 배포 단계

### 1. Vercel 프로젝트 생성
1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속
2. "Add New Project" 클릭
3. GitHub 저장소 연결
4. 프로젝트 선택

### 2. 프로젝트 설정
- **Framework Preset**: Next.js
- **Root Directory**: `./` (프로젝트 루트)
- **Build Command**: `npm run build` (기본값)
- **Output Directory**: `.next` (기본값)
- **Install Command**: `npm install` (기본값)

### 3. 환경 변수 설정
Vercel Dashboard의 Project Settings → Environment Variables에서 다음을 추가:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
```

**중요**: 
- Production, Preview, Development 모든 환경에 동일한 값 설정 권장
- 민감한 정보는 절대 코드에 하드코딩하지 마세요

### 4. 배포
- "Deploy" 버튼 클릭
- 자동으로 빌드 및 배포가 시작됩니다

## 배포 후 확인사항

### 1. 기능 테스트
- [ ] 로그인/로그아웃 기능
- [ ] 회원가입 기능
- [ ] 아티스트 생성/전환
- [ ] 프로젝트 생성/관리
- [ ] 멤버 초대/관리
- [ ] 파일 업로드 (프로필 이미지, 커버 이미지)

### 2. 성능 확인
- [ ] Lighthouse 점수 확인 (Performance, Accessibility, Best Practices, SEO)
- [ ] Core Web Vitals 확인 (LCP, FID, CLS)

### 3. 에러 모니터링
- Vercel Dashboard의 Logs 탭에서 런타임 에러 확인
- 브라우저 콘솔에서 클라이언트 에러 확인

## 자동 배포 설정

### GitHub 연동
Vercel은 기본적으로 다음과 같이 자동 배포됩니다:
- **main/master 브랜치**: Production 배포
- **다른 브랜치**: Preview 배포 (테스트용 URL 생성)
- **Pull Request**: PR별로 독립된 Preview 배포

### 배포 제어
`vercel.json` 파일을 통해 배포 동작을 커스터마이징할 수 있습니다 (선택사항).

## 트러블슈팅

### 빌드 실패
1. 로컬에서 `npm run build` 실행하여 빌드 오류 확인
2. `package.json`의 dependencies가 올바른지 확인
3. Next.js 버전 호환성 확인

### 런타임 에러
1. 환경 변수가 올바르게 설정되었는지 확인
2. Supabase URL과 Anon Key가 유효한지 확인
3. Vercel 로그에서 상세 에러 메시지 확인

### 성능 문제
1. 이미지 최적화: `next/image` 사용 권장
2. Code Splitting: 동적 import 활용
3. CDN 캐싱: Vercel의 Edge Network 활용

## 추가 최적화

### 1. 도메인 연결
- Vercel Dashboard → Settings → Domains
- 커스텀 도메인 추가 및 DNS 설정

### 2. Analytics 활성화
- Vercel Analytics: 무료 Web Analytics
- Speed Insights: Core Web Vitals 모니터링

### 3. 보안 강화
- HTTPS 자동 적용 (Vercel 기본)
- Security Headers 설정 (next.config.js)
- CORS 정책 확인

## 참고 자료
- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Supabase + Vercel 통합](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

