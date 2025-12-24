# 개발 서버 실행 가이드

## 사전 요구사항 확인

### 1. Node.js 설치 확인
```bash
node --version
# v18.0.0 이상 권장
```

### 2. npm 설치 확인
```bash
npm --version
# v9.0.0 이상 권장
```

### 3. 의존성 설치
```bash
npm install
```

### 4. 환경 변수 설정
`.env.local` 파일이 프로젝트 루트에 있는지 확인하고, 다음 변수들이 설정되어 있는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**참고**: 환경 변수가 없어도 개발 서버는 실행되지만, Supabase 기능은 작동하지 않습니다.

## 개발 서버 실행

### 기본 실행
```bash
npm run dev
```

서버가 시작되면 브라우저에서 [http://localhost:3000](http://localhost:3000)에 접속하세요.

### 포트 변경
기본 포트(3000)가 사용 중인 경우:
```bash
npm run dev -- -p 3001
```

## 문제 해결

### 포트가 이미 사용 중인 경우
```bash
# Windows
netstat -ano | findstr :3000
# 프로세스 종료 후 다시 실행
```

### 캐시 문제
```bash
# .next 폴더 삭제 후 재실행
rm -rf .next
npm run dev
```

### 의존성 문제
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### TypeScript 오류
```bash
# 타입 체크
npm run lint
```

### 환경 변수 변경 후
환경 변수를 변경한 경우 개발 서버를 재시작해야 합니다.

## 개발 도구

### 빌드 테스트
```bash
npm run build
```

### 프로덕션 서버 실행
```bash
npm run build
npm run start
```

### 린트 실행
```bash
npm run lint
```

## 주요 경로

- 홈: `http://localhost:3000`
- Supabase 테스트: `http://localhost:3000/test-supabase`

## 다음 단계

1. Supabase 연결 확인: `/test-supabase` 페이지 방문
2. 컴포넌트 추가: `npx shadcn-ui@latest add [component-name]`
3. 개발 시작!

