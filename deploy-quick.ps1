# 빠른 배포 스크립트
# 코드 수정 후 이 스크립트를 실행하면 자동으로 배포됩니다

Write-Host "🚀 Boostar 프로젝트 재배포 시작..." -ForegroundColor Cyan
Write-Host ""

# 변경사항 확인
Write-Host "📝 변경사항 확인 중..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "변경된 파일:" -ForegroundColor Gray
    $status | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host ""
} else {
    Write-Host "⚠️  변경된 파일이 없습니다." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "계속하시겠습니까? (y/n)"
    if ($continue -ne "y") {
        exit 0
    }
}

# 커밋 메시지 입력
Write-Host "💬 커밋 메시지를 입력하세요:" -ForegroundColor Yellow
$commitMessage = Read-Host "메시지"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Update: 코드 수정"
    Write-Host "기본 메시지 사용: $commitMessage" -ForegroundColor Gray
}

# Git 작업
Write-Host ""
Write-Host "📦 Git에 추가 중..." -ForegroundColor Yellow
git add .

Write-Host "💾 커밋 중..." -ForegroundColor Yellow
git commit -m $commitMessage

Write-Host "🚀 GitHub에 푸시 중..." -ForegroundColor Yellow
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 푸시 완료!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vercel이 자동으로 새 배포를 시작합니다." -ForegroundColor Cyan
    Write-Host "배포 상태 확인: https://vercel.com/dashboard" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⏱️  배포 완료까지 약 3-4분 소요됩니다." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ 푸시 실패" -ForegroundColor Red
    Write-Host "오류를 확인하고 다시 시도하세요." -ForegroundColor Yellow
}

