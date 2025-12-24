# Windows 파일 시스템 오류 완전 해결 가이드

## 적용된 해결책

### 1. Turbopack 사용 (가장 중요!)
**Turbopack**은 Next.js의 새로운 번들러로 Rust로 작성되어 Windows 파일 시스템과의 호환성이 뛰어납니다.

```bash
npm run dev  # 이제 자동으로 Turbopack 사용
```

### 2. 설정 변경 사항

#### package.json
- `--turbo` 플래그 추가로 Turbopack 사용
- Node.js 메모리 증가

#### next.config.js
- Webpack 병렬 처리 = 1 (파일 잠금 방지)
- 캐시 비활성화
- 압축 및 ETag 비활성화

#### restart-dev.ps1
- Node 프로세스 완전 종료
- .next 폴더 삭제 재시도 로직
- Turbopack으로 재시작

### 3. Windows Defender 제외 추가 (권장)

파일 시스템 오류를 완전히 없애려면:

1. **Windows 보안** 열기
2. **바이러스 및 위협 방지** → **설정 관리**
3. **제외** → **제외 추가** → **폴더**
4. 다음 폴더 추가:
   ```
   C:\Users\user\Desktop\Boostar\dev
   C:\Users\user\Desktop\Boostar\dev\.next
   C:\Users\user\Desktop\Boostar\dev\node_modules
   ```

### 4. 사용 방법

#### 일반 시작
```powershell
.\restart-dev.ps1
```

#### 문제 발생 시
```powershell
# 1. Ctrl+C로 서버 중지
# 2. 모든 Node 프로세스 강제 종료
taskkill /F /IM node.exe
# 3. 재시작
.\restart-dev.ps1
```

### 5. Turbopack의 장점

- ✅ **10배 빠른 HMR**: Hot Module Replacement가 훨씬 빠름
- ✅ **Windows 최적화**: 파일 시스템 호환성 개선
- ✅ **메모리 효율적**: Rust로 작성되어 메모리 사용량 적음
- ✅ **안정성**: 파일 잠금 문제가 거의 없음

## 왜 이 오류가 발생했나?

### 근본 원인
1. **Windows 파일 잠금**: Windows는 파일을 열고 있는 동안 다른 프로세스의 접근을 차단
2. **Webpack의 동시 접근**: Webpack이 여러 파일을 동시에 읽고 쓰려고 시도
3. **HMR의 빠른 갱신**: Hot Module Replacement가 파일이 완전히 쓰여지기 전에 읽기 시도
4. **바이러스 백신**: Windows Defender나 다른 백신이 실시간으로 파일 스캔

### Turbopack이 해결하는 방법
- Rust의 안전한 파일 시스템 API 사용
- 더 나은 파일 잠금 처리
- 증분 빌드로 파일 접근 최소화

## 추가 팁

### 포트 변경
```bash
npm run dev -- -p 3001
```

### 완전 초기화
```powershell
taskkill /F /IM node.exe
Remove-Item -Recurse -Force .next, node_modules
npm install
.\restart-dev.ps1
```

### 성능 모니터링
Turbopack은 컴파일 시간을 표시하므로 성능 향상을 확인할 수 있습니다.

