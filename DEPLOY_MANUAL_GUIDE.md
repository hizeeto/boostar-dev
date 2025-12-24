# 🚀 Boostar Vercel 배포 - 완전 가이드

## ⚠️ Vercel CLI 한글 이름 오류 해결

Vercel CLI가 Windows 사용자 이름에 한글이 포함되어 있으면 로그인이 안 되는 버그가 있습니다.

**해결 방법: 브라우저를 통한 수동 배포**

---

## 📋 방법 1: Vercel 웹사이트에서 직접 배포 (가장 쉬움)

### Step 1: GitHub에 코드 푸시

#### 1-1. GitHub 로그인 및 저장소 생성
1. https://github.com/new 브라우저에서 열기
2. 로그인
3. Repository name: `boostar-dev` 입력
4. Public 또는 Private 선택
5. **"Add a README file" 체크 해제** (중요!)
6. "Create repository" 클릭

#### 1-2. PowerShell에서 코드 푸시
GitHub가 제공하는 명령어 중 "...or push an existing repository from the command line" 부분을 복사하여 실행:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/boostar-dev.git
git branch -M main
git push -u origin main
```

**실제 명령어 예시:**
```powershell
# YOUR_USERNAME을 실제 GitHub 아이디로 변경
git remote add origin https://github.com/YOUR_USERNAME/boostar-dev.git
git branch -M main
git push -u origin main
```

처음 푸시할 때 GitHub 로그인이 필요할 수 있습니다.

### Step 2: Vercel에 배포

#### 2-1. Vercel 로그인 및 프로젝트 가져오기
1. https://vercel.com 접속
2. GitHub로 로그인
3. 대시보드에서 **"Add New..." → "Project"** 클릭
4. **"Import Git Repository"** 선택
5. 방금 만든 `boostar-dev` 저장소 찾기
6. **"Import"** 클릭

#### 2-2. 프로젝트 설정 확인
다음 설정이 자동으로 감지되는지 확인:
```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

#### 2-3. 환경 변수 추가 (매우 중요! ⚠️)
**"Environment Variables"** 섹션을 펼치고:

1. Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: Supabase 프로젝트 URL 입력
   - 예: `https://xxxxxxxxxxxxx.supabase.co`

2. Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: Supabase Anon Key 입력
   - 예: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

환경 변수를 **반드시 추가**해야 합니다! 없으면 앱이 작동하지 않습니다.

#### 2-4. 배포 시작
**"Deploy"** 버튼 클릭!

배포가 진행되며 2-3분 정도 소요됩니다.

---

## 📋 방법 2: GitHub Desktop 사용 (GUI 선호 시)

### Step 1: GitHub Desktop 설치
1. https://desktop.github.com 에서 다운로드
2. 설치 및 GitHub 계정으로 로그인

### Step 2: 저장소 푸시
1. GitHub Desktop 실행
2. **File → Add Local Repository**
3. 현재 프로젝트 폴더 선택: `C:\Users\user\Desktop\Boostar\dev`
4. **Publish repository** 클릭
5. 이름 확인: `boostar-dev`
6. Public/Private 선택
7. **Publish repository** 클릭

### Step 3: Vercel 배포
위의 "방법 1 - Step 2"와 동일하게 진행

---

## 📋 방법 3: Vercel CLI 토큰 사용 (고급)

Vercel Dashboard에서 토큰을 받아 CLI로 배포:

### Step 1: Vercel 토큰 생성
1. https://vercel.com/account/tokens 접속
2. **"Create Token"** 클릭
3. 토큰 이름: `boostar-deploy`
4. Scope: Full Account
5. **"Create"** 클릭
6. 생성된 토큰 복사 (다시 볼 수 없으니 주의!)

### Step 2: 토큰으로 배포
```powershell
# 환경 변수로 토큰 설정
$env:VERCEL_TOKEN="your-vercel-token-here"

# 배포 실행
vercel --prod --token $env:VERCEL_TOKEN --yes
```

---

## ✅ 배포 완료 후 확인사항

### 1. 배포 상태 확인
- Vercel Dashboard에서 배포 로그 확인
- "Building" → "Deploying" → "Ready" 상태 확인

### 2. 배포된 사이트 접속
- Vercel이 제공하는 URL 클릭 (예: `https://boostar-dev.vercel.app`)
- 로그인 페이지가 정상적으로 로드되는지 확인

### 3. 기능 테스트
- [ ] 로그인/회원가입
- [ ] 아티스트 생성
- [ ] 프로젝트 생성
- [ ] 이미지 업로드

### 4. 환경 변수 확인
환경 변수를 나중에 추가했다면:
1. Vercel Dashboard → Settings → Environment Variables
2. 변수가 올바르게 설정되었는지 확인
3. Deployments 탭으로 이동
4. 최신 배포에서 **"Redeploy"** 클릭

---

## 🔧 자주 발생하는 문제

### 문제 1: "Authentication error"
**원인**: 환경 변수가 설정되지 않음
**해결**: 
1. Vercel Dashboard → Settings → Environment Variables
2. `NEXT_PUBLIC_SUPABASE_URL`와 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
3. Redeploy

### 문제 2: "Build failed"
**원인**: 빌드 오류
**해결**:
1. 로컬에서 `npm run build` 실행하여 오류 확인
2. 오류 수정 후 다시 푸시

### 문제 3: 페이지가 404
**원인**: 라우팅 문제
**해결**:
- Next.js 프로젝트 구조 확인
- `src/app` 폴더가 올바른지 확인

---

## 📞 도움이 필요하면

1. Vercel 빌드 로그 복사
2. 오류 메시지 전체 복사
3. 스크린샷과 함께 문의

---

## 🎉 성공!

배포가 완료되면:
- ✅ 자동으로 HTTPS 적용됨
- ✅ CDN을 통한 빠른 로딩
- ✅ Git push만으로 자동 재배포
- ✅ Preview URL로 테스트 가능

**배포 URL을 공유하고 팀원들과 함께 사용하세요!** 🚀

