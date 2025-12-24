# Vercel 배포 자동화 가이드

## 배포 진행 중...

Vercel CLI를 사용하여 배포를 진행합니다.

### 진행 상황
1. ✅ Git 저장소 초기화 완료
2. ✅ Vercel CLI 설치 완료 (v50.1.3)
3. ✅ vercel.json 설정 파일 생성
4. 🔄 Vercel 로그인 진행 중...

### 다음 단계

아래 명령어를 실행하여 배포를 완료하세요:

```powershell
# 1. Vercel 로그인 (브라우저가 열립니다)
vercel login

# 2. 배포 시작 (대화형)
vercel

# 질문에 대한 답변:
# - Set up and deploy? [Y/n] y
# - Which scope? (본인 계정 선택)
# - Link to existing project? [y/N] n
# - What's your project's name? boostar-dev
# - In which directory is your code located? ./
# - Want to override the settings? [y/N] n

# 3. 프로덕션 배포
vercel --prod
```

### 환경 변수 설정

배포 후 Vercel Dashboard에서 환경 변수를 추가해야 합니다:

1. https://vercel.com/dashboard 접속
2. 방금 배포한 프로젝트 선택
3. Settings → Environment Variables
4. 다음 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL` = your-supabase-url
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your-anon-key
5. Deployments → 최신 배포 → Redeploy

## 자동 배포 스크립트

또는 아래 스크립트를 사용하세요:

```powershell
# deploy.ps1
vercel --prod --yes
```

저장 후 실행:
```powershell
.\deploy.ps1
```

