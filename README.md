# Boostar

Next.js, Supabase, shadcn/ui를 사용한 웹서비스 프로젝트입니다.

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database & Auth**: Supabase
- **Package Manager**: npm

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Supabase 프로젝트 URL과 Anon Key는 [Supabase Dashboard](https://app.supabase.com)에서 확인할 수 있습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
├── src/
│   ├── app/              # Next.js App Router 페이지
│   ├── components/        # React 컴포넌트
│   │   └── ui/           # shadcn/ui 컴포넌트
│   ├── lib/              # 유틸리티 및 설정
│   │   ├── supabase/     # Supabase 클라이언트 설정
│   │   └── utils.ts      # 공통 유틸리티
│   └── middleware.ts     # Next.js 미들웨어
├── components.json       # shadcn/ui 설정
├── tailwind.config.ts   # Tailwind CSS 설정
└── tsconfig.json        # TypeScript 설정
```

## 주요 기능

### Supabase 설정

- **클라이언트 사이드**: `src/lib/supabase/client.ts`
- **서버 사이드**: `src/lib/supabase/server.ts`
- **미들웨어**: `src/lib/supabase/middleware.ts`

### shadcn/ui 사용

새로운 컴포넌트를 추가하려면:

```bash
npx shadcn-ui@latest add [component-name]
```

예시:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
```

## 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행
- `npm run lint` - ESLint 실행

## 추가 리소스

- [Next.js 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [shadcn/ui 문서](https://ui.shadcn.com)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)

