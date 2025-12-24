# Vercel 배포를 위한 PowerShell 스크립트

Write-Host "🚀 Boostar 프로젝트를 Vercel에 배포합니다..." -ForegroundColor Cyan
Write-Host ""

# Vercel CLI 확인
Write-Host "📦 Vercel CLI 확인 중..." -ForegroundColor Yellow
$vercelVersion = vercel --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Vercel CLI가 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host "다음 명령어로 설치하세요: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Vercel CLI 버전: $vercelVersion" -ForegroundColor Green
Write-Host ""

# Git 상태 확인
Write-Host "📝 Git 상태 확인 중..." -ForegroundColor Yellow
$gitStatus = git status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git 저장소가 아닙니다." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Git 저장소 확인됨" -ForegroundColor Green
Write-Host ""

# 빌드 테스트
Write-Host "🔨 프로덕션 빌드 테스트 중..." -ForegroundColor Yellow
Write-Host "(빌드에 시간이 걸릴 수 있습니다...)" -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 빌드 실패! 오류를 수정한 후 다시 시도하세요." -ForegroundColor Red
    exit 1
}
Write-Host "✅ 빌드 성공!" -ForegroundColor Green
Write-Host ""

# Vercel 배포
Write-Host "🚀 Vercel에 배포 중..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  중요: 환경 변수 설정을 잊지 마세요!" -ForegroundColor Yellow
Write-Host "   - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Gray
Write-Host "   - NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Gray
Write-Host ""

# 배포 실행
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 배포 완료!" -ForegroundColor Green
    Write-Host ""
    Write-Host "다음 단계:" -ForegroundColor Cyan
    Write-Host "1. Vercel Dashboard에서 환경 변수 추가" -ForegroundColor White
    Write-Host "2. 배포 재시작 (Redeploy)" -ForegroundColor White
    Write-Host "3. 배포된 URL에서 테스트" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ 배포 실패" -ForegroundColor Red
    Write-Host "오류 메시지를 확인하고 다시 시도하세요." -ForegroundColor Yellow
}

