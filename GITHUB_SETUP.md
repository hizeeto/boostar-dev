# GitHub 저장소 설정 헬퍼

## 현재 상태
- ✅ Git 저장소 초기화 완료
- ✅ 226개 파일 커밋 완료
- ❌ GitHub remote 설정 필요

## 빠른 설정 방법

### 1단계: GitHub 저장소 생성
브라우저에서: https://github.com/new

설정:
- Repository name: boostar-dev
- Public/Private 선택
- **체크박스 모두 해제** (중요!)
- Create repository 클릭

### 2단계: Remote 연결 및 푸시

GitHub가 제공하는 명령어를 복사하거나, 아래 명령어를 사용하세요:
(YOUR_USERNAME을 실제 GitHub 사용자 이름으로 변경)

```powershell
# Remote 추가
git remote add origin https://github.com/YOUR_USERNAME/boostar-dev.git

# 브랜치 이름을 main으로 변경
git branch -M main

# 푸시
git push -u origin main
```

### 예시 (사용자 이름이 kimseunggi인 경우):
```powershell
git remote add origin https://github.com/kimseunggi/boostar-dev.git
git branch -M main
git push -u origin main
```

## 문제 해결

### "remote origin already exists" 오류
```powershell
git remote remove origin
# 그 다음 위의 명령어 다시 실행
```

### "Repository not found" 오류
1. GitHub 저장소가 실제로 생성되었는지 확인
2. 사용자 이름 철자 확인
3. Private 저장소라면 권한 확인

### 인증 오류
- GitHub Desktop 설치 후 사용 권장
- 또는 Personal Access Token 생성

## GitHub Desktop 사용 (가장 쉬움)

1. GitHub Desktop 다운로드: https://desktop.github.com
2. 설치 후 GitHub 계정으로 로그인
3. File → Add Local Repository
4. 현재 폴더 선택: C:\Users\user\Desktop\Boostar\dev
5. "Publish repository" 버튼 클릭
6. 저장소 이름 확인 후 Publish

✅ 완료!

## 다음은?

GitHub에 푸시 완료 후:
1. https://vercel.com/new 접속
2. GitHub 저장소 Import
3. 환경 변수 설정
4. Deploy!

