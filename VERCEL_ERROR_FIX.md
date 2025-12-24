# Vercel 배포 가이드 - 오류 해결

## 오류 원인
`Error: No Next.js version detected`

이 오류는 다음과 같은 이유로 발생합니다:
1. Git 저장소가 없음 (해결 완료 ✅)
2. Root Directory 설정이 잘못됨
3. package.json을 찾을 수 없음

## 해결 방법

### 방법 1: GitHub 연동 (권장) ⭐

#### 1단계: GitHub 저장소 생성
1. https://github.com/new 접속
2. Repository name: `boostar-dev` (원하는 이름)
3. Public/Private 선택
4. **Initialize 옵션은 모두 체크 해제** (중요!)
5. "Create repository" 클릭

#### 2단계: GitHub에 푸시
PowerShell에서 다음 명령어 실행:

```powershell
# GitHub에서 제공하는 URL로 변경하세요
git remote add origin https://github.com/YOUR_USERNAME/boostar-dev.git
git branch -M main
git push -u origin main
```

#### 3단계: Vercel 배포
1. https://vercel.com/dashboard 접속
2. "Add New Project" 클릭
3. "Import Git Repository" 선택
4. GitHub 계정 연결 (처음이면)
5. 방금 만든 저장소 선택
6. **프로젝트 설정 확인**:
   ```
   Framework Preset: Next.js (자동 감지)
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```
7. **환경 변수 추가** (중요!):
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
   ```
8. "Deploy" 클릭

### 방법 2: Vercel CLI 사용

#### 설치 및 배포
```powershell
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포 (첫 배포)
vercel

# 프로덕션 배포
vercel --prod
```

#### CLI 배포 시 주의사항
- 첫 배포 시 프로젝트 설정 질문에 답변
- 환경 변수는 대화형으로 입력하거나 `.vercel/project.json` 파일 생성

### 방법 3: Vercel for Git 없이 배포

1. 프로젝트 폴더를 ZIP 파일로 압축
2. https://vercel.com/new 접속
3. "Browse" 클릭하여 ZIP 파일 업로드
4. 설정 확인 후 배포

## Root Directory 문제 해결

만약 여전히 오류가 발생한다면:

### Vercel Dashboard에서 설정 확인
1. Project Settings → General
2. **Root Directory** 확인:
   - 현재 설정: `./` 또는 비어있음 (올바름)
   - package.json이 있는 위치와 일치해야 함

### 잘못된 경우 예시
```
❌ Root Directory: dev/
❌ Root Directory: src/
✅ Root Directory: ./  (또는 비어있음)
```

## 배포 후 확인사항

### 1. 빌드 로그 확인
- Vercel Dashboard → Deployments → 최근 배포 클릭
- "Building" 단계에서 로그 확인
- Next.js 버전이 올바르게 감지되는지 확인:
  ```
  Detected Next.js version: 14.2.5
  ```

### 2. 환경 변수 확인
- Project Settings → Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`와 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 설정되어 있는지 확인

### 3. 도메인 접속 테스트
- 배포 완료 후 제공되는 URL 접속 (예: https://boostar-dev.vercel.app)
- 로그인/회원가입 기능 테스트

## 자주 발생하는 오류

### 1. "No Next.js version detected"
**원인**: Git 저장소가 없거나 Root Directory가 잘못됨
**해결**: 
- ✅ Git 초기화 완료 (이미 해결됨)
- Root Directory를 `./`로 설정

### 2. "Module not found"
**원인**: 빌드 시 의존성 설치 실패
**해결**: 
```powershell
# 로컬에서 테스트
rm -r node_modules
npm install
npm run build
```

### 3. "Environment variable missing"
**원인**: Supabase 환경 변수 미설정
**해결**: Vercel Dashboard에서 환경 변수 추가

## 현재 상태

✅ Git 저장소 초기화 완료
✅ 프로젝트 파일 커밋 완료
✅ 빌드 테스트 성공
✅ package.json에 Next.js 14.2.5 포함

## 다음 단계

1. **GitHub 저장소 생성 및 푸시** (권장)
   - 위의 "방법 1" 따라하기

2. **Vercel 프로젝트 생성**
   - GitHub 저장소 연결
   - 환경 변수 설정

3. **배포 및 테스트**
   - 자동 배포 완료 대기
   - 배포된 URL에서 기능 테스트

## 문의사항

추가 오류가 발생하면:
1. Vercel 빌드 로그 전체 복사
2. 오류 메시지와 함께 문의

