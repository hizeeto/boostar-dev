/**
 * Supabase 마이그레이션 실행 스크립트
 * 
 * 사용법:
 * node scripts/run-migration.js add_is_archived_to_projects.sql
 * 
 * 또는 package.json의 스크립트 사용:
 * npm run migrate add_is_archived_to_projects.sql
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('❌ 마이그레이션 파일명을 입력하세요.')
  console.log('사용법: node scripts/run-migration.js <migration-file>')
  console.log('예시: node scripts/run-migration.js add_is_archived_to_projects.sql')
  process.exit(1)
}

const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile)

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ 마이그레이션 파일을 찾을 수 없습니다: ${migrationPath}`)
  process.exit(1)
}

console.log(`📄 마이그레이션 파일: ${migrationFile}`)
console.log(`📂 경로: ${migrationPath}`)
console.log('')

// Supabase CLI가 설치되어 있는지 확인
try {
  execSync('supabase --version', { stdio: 'ignore' })
} catch (error) {
  console.error('❌ Supabase CLI가 설치되어 있지 않습니다.')
  console.log('')
  console.log('설치 방법:')
  console.log('  npm install -g supabase')
  console.log('  또는')
  console.log('  npx supabase --version')
  console.log('')
  console.log('또는 Supabase Dashboard의 SQL Editor에서 수동으로 실행하세요:')
  console.log(`  파일: ${migrationPath}`)
  process.exit(1)
}

// SQL 파일 내용 읽기
const sql = fs.readFileSync(migrationPath, 'utf-8')
console.log('📋 SQL 내용:')
console.log('─'.repeat(50))
console.log(sql.substring(0, 500) + (sql.length > 500 ? '...' : ''))
console.log('─'.repeat(50))
console.log('')

// Supabase CLI를 사용하여 마이그레이션 실행
console.log('🚀 Supabase CLI를 사용하여 마이그레이션을 실행합니다...')
console.log('')

try {
  // Supabase 프로젝트가 연결되어 있는지 확인
  try {
    execSync('supabase status', { stdio: 'ignore' })
  } catch (error) {
    console.log('⚠️  Supabase 프로젝트가 연결되지 않았습니다.')
    console.log('')
    console.log('다음 명령어로 프로젝트를 연결하세요:')
    console.log('  supabase link --project-ref your-project-ref')
    console.log('')
    console.log('또는 Supabase Dashboard의 SQL Editor에서 수동으로 실행하세요.')
    process.exit(1)
  }

  // 마이그레이션 실행
  // 참고: Supabase CLI는 마이그레이션 파일을 자동으로 감지하고 실행합니다.
  // 하지만 개별 파일을 실행하려면 SQL을 직접 실행해야 합니다.
  console.log('💡 Supabase CLI는 마이그레이션 파일을 자동으로 관리합니다.')
  console.log('   개별 파일을 실행하려면 다음 방법을 사용하세요:')
  console.log('')
  console.log('방법 1: Supabase Dashboard SQL Editor')
  console.log('  1. https://app.supabase.com 접속')
  console.log('  2. 프로젝트 선택 > SQL Editor')
  console.log('  3. 아래 SQL을 복사하여 붙여넣기')
  console.log('  4. 실행 버튼 클릭')
  console.log('')
  console.log('방법 2: Supabase CLI db push')
  console.log('  supabase db push')
  console.log('')
  console.log('📋 실행할 SQL:')
  console.log('─'.repeat(50))
  console.log(sql)
  console.log('─'.repeat(50))
  
} catch (error) {
  console.error('❌ 마이그레이션 실행 중 오류가 발생했습니다:', error.message)
  process.exit(1)
}

