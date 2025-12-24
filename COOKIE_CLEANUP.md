# 쿠키 충돌 문제 해결

## 문제 상황

2개의 서로 다른 Supabase 프로젝트 쿠키가 동시에 존재:
- `sb-sbgjedhgrptvljmrdagq-auth-token`
- `sb-emgduqmtqqezjidmbckr-auth-token`

환경 변수의 Supabase URL과 맞지 않는 쿠키 때문에 세션을 읽지 못함.

## 해결 방법

### 1. 브라우저에서 모든 쿠키 삭제

**Chrome/Edge:**
1. `F12` (개발자 도구 열기)
2. **Application** 탭 클릭
3. 왼쪽 **Cookies** → `http://localhost:3002` 클릭
4. 모든 `sb-` 쿠키를 **우클릭 → Delete** 또는 **Clear all** 버튼 클릭
5. 페이지 새로고침 (`F5`)

### 2. 다시 로그인

쿠키 삭제 후:
1. `/login` 페이지로 이동
2. 로그인 시도
3. 올바른 프로젝트의 쿠키만 생성됨

### 3. 확인 사항

로그인 후 개발자 도구에서 확인:
- **Application > Cookies**에서 `sb-` 쿠키가 **1개만** 있어야 함
- 쿠키 이름의 프로젝트 ID가 `.env.local`의 URL과 일치해야 함

## 환경 변수 확인

`.env.local` 파일 확인:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[프로젝트ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

쿠키 이름: `sb-[프로젝트ID]-auth-token`

**프로젝트 ID가 일치해야 합니다!**

## 만약 문제가 계속되면

### 옵션 1: 시크릿 창 사용
- 브라우저 시크릿/프라이빗 모드로 테스트
- 깨끗한 상태에서 로그인 시도

### 옵션 2: 브라우저 캐시 전체 삭제
1. `Ctrl + Shift + Delete`
2. **쿠키 및 기타 사이트 데이터** 선택
3. **캐시된 이미지 및 파일** 선택
4. **데이터 삭제**

### 옵션 3: 다른 포트 사용
```powershell
# 개발 서버 중단 후
$env:PORT=3000
npm run dev
```

## 예상 결과

쿠키 정리 후 로그인하면:
```
[Middleware] 요청 쿠키: {
  total: 1,
  authCookies: [
    { name: 'sb-emgduqmtqqezjidmbckr-auth-token', hasValue: true }
  ]
}
[Middleware] {
  pathname: '/console',
  hasUser: true,  ← ✅ true로 변경
  userId: '...',
  userEmail: 'user@example.com'
}
[getUserProfile] 프로필 데이터 조회 성공
```

