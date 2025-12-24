# Next.js 개발 서버 재시작 스크립트 (Turbopack 사용)
Write-Host "=== Next.js 개발 서버 재시작 (Turbopack) ===" -ForegroundColor Cyan

# 1. Node 프로세스 종료
Write-Host "`n1. 실행 중인 Node 프로세스 종료 중..." -ForegroundColor Yellow
$processes = Get-Process -Name node -ErrorAction SilentlyContinue
if ($processes) {
    $processes | ForEach-Object {
        Write-Host "  - PID $($_.Id) 종료" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 3
} else {
    Write-Host "  - 실행 중인 Node 프로세스가 없습니다" -ForegroundColor Gray
}

# 2. .next 폴더 삭제
Write-Host "`n2. .next 폴더 삭제 중..." -ForegroundColor Yellow
if (Test-Path .next) {
    # 여러 번 시도
    $attempts = 0
    $maxAttempts = 3
    while ($attempts -lt $maxAttempts) {
        try {
            Remove-Item -Recurse -Force .next -ErrorAction Stop
            Write-Host "  - .next 폴더 삭제 완료" -ForegroundColor Green
            break
        } catch {
            $attempts++
            if ($attempts -lt $maxAttempts) {
                Write-Host "  - 재시도 중... ($attempts/$maxAttempts)" -ForegroundColor Yellow
                Start-Sleep -Seconds 2
            } else {
                Write-Host "  - 경고: .next 폴더 삭제 실패. 계속 진행합니다." -ForegroundColor Red
            }
        }
    }
} else {
    Write-Host "  - .next 폴더가 없습니다" -ForegroundColor Gray
}

# 3. 캐시 삭제
Write-Host "`n3. 캐시 삭제 중..." -ForegroundColor Yellow
if (Test-Path node_modules\.cache) {
    Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
    Write-Host "  - 캐시 삭제 완료" -ForegroundColor Green
} else {
    Write-Host "  - 캐시가 없습니다" -ForegroundColor Gray
}

# 4. 개발 서버 시작 (Turbopack 사용)
Write-Host "`n4. 개발 서버 시작 (Turbopack으로 빠른 HMR)..." -ForegroundColor Yellow
Write-Host "  Turbopack: Windows 파일 시스템 호환성이 개선되었습니다`n" -ForegroundColor Cyan
npm run dev
