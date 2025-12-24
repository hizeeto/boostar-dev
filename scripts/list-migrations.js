/**
 * 사용 가능한 마이그레이션 파일 목록 표시
 * 
 * 사용법:
 * node scripts/list-migrations.js
 * 또는
 * npm run migrate:list
 */

const fs = require('fs')
const path = require('path')

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')

if (!fs.existsSync(migrationsDir)) {
  console.error('❌ 마이그레이션 디렉토리를 찾을 수 없습니다:', migrationsDir)
  process.exit(1)
}

const files = fs.readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()

if (files.length === 0) {
  console.log('📭 마이그레이션 파일이 없습니다.')
  process.exit(0)
}

console.log('📋 사용 가능한 마이그레이션 파일:')
console.log('─'.repeat(50))

files.forEach((file, index) => {
  const filePath = path.join(migrationsDir, file)
  const stats = fs.statSync(filePath)
  const size = (stats.size / 1024).toFixed(2)
  const modified = stats.mtime.toLocaleDateString('ko-KR')
  
  console.log(`${index + 1}. ${file}`)
  console.log(`   크기: ${size} KB`)
  console.log(`   수정일: ${modified}`)
  console.log('')
})

console.log('─'.repeat(50))
console.log(`총 ${files.length}개의 마이그레이션 파일`)
console.log('')
console.log('마이그레이션 실행 방법:')
console.log('  npm run migrate <파일명>')
console.log('  예시: npm run migrate add_is_archived_to_projects.sql')

