# 문제 해결 가이드

## Windows 파일 시스템 오류 해결

### 증상
```
[Error: UNKNOWN: unknown error, open 'C:\...\layout.js']
errno: -4094
code: 'UNKNOWN'
syscall: 'open'
```

### 원인
Windows에서 Next.js가 빌드한 파일에 접근할 때 발생하는 파일 잠금 문제입니다.

### 해결 방법

#### 방법 1: PowerShell 스크립트 사용 (권장)
```powershell
.\restart-dev.ps1
```

#### 방법 2: 수동 재시작
1. **Ctrl+C**로 개발 서버 종료
2. 다음 명령어 실행:
```powershell
# Node 프로세스 종료
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 캐시 삭제
npm run clean

# 서버 재시작
npm run dev
```

#### 방법 3: Windows Defender 제외 추가
1. Windows 보안 > 바이러스 및 위협 방지 > 설정 관리
2. 제외 > 제외 추가 > 폴더
3. 프로젝트 폴더 추가: `C:\Users\user\Desktop\Boostar\dev`

### 예방책

프로젝트의 `next.config.js`에 다음 설정이 적용되어 있습니다:
- Webpack 캐시 비활성화
- 파일 시스템 폴링 방식 사용
- 스냅샷 기능 비활성화

### 추가 팁

1. **바이러스 백신 일시 중지**: 개발 중 실시간 스캔을 일시 중지하면 도움이 될 수 있습니다.

2. **포트 변경**: 여러 개발 서버가 실행 중이면 포트를 지정하세요:
```bash
npm run dev -- -p 3001
```

3. **새로 시작**: 모든 것이 실패하면:
```powershell
# 모든 Node 프로세스 종료
taskkill /F /IM node.exe

# node_modules 재설치
Remove-Item -Recurse -Force node_modules
npm install

# 깨끗하게 시작
.\restart-dev.ps1
```

## 기타 문제

### 포트가 사용 중입니다
```powershell
# 3000 포트를 사용하는 프로세스 찾기
netstat -ano | findstr :3000

# 해당 PID 종료 (예: PID가 1234인 경우)
taskkill /F /PID 1234
```

### npm install 오류
```powershell
# npm 캐시 정리
npm cache clean --force

# package-lock.json 삭제 후 재설치
Remove-Item package-lock.json
Remove-Item -Recurse -Force node_modules
npm install
```

