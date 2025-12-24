/**
 * Supabase 마이그레이션 유틸리티
 * 
 * 주의: Supabase는 PostgREST를 사용하므로 DDL 문을 직접 실행할 수 없습니다.
 * 마이그레이션을 실행하려면:
 * 1. Supabase Dashboard의 SQL Editor 사용
 * 2. Supabase CLI 사용 (권장)
 * 3. 이 유틸리티 함수를 사용하여 마이그레이션 파일을 읽고 표시
 */

import { readFile } from 'fs/promises'
import { join } from 'path'

export interface MigrationFile {
  name: string
  path: string
  sql: string
}

/**
 * 마이그레이션 파일 목록 가져오기
 */
export async function getMigrationFiles(): Promise<string[]> {
  try {
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
    const fs = await import('fs/promises')
    const files = await fs.readdir(migrationsDir)
    return files.filter((file) => file.endsWith('.sql'))
  } catch (error) {
    console.error('마이그레이션 파일 목록을 가져올 수 없습니다:', error)
    return []
  }
}

/**
 * 마이그레이션 파일 읽기
 */
export async function readMigrationFile(filename: string): Promise<string> {
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', filename)
  return await readFile(migrationPath, 'utf-8')
}

/**
 * 모든 마이그레이션 파일 읽기
 */
export async function getAllMigrations(): Promise<MigrationFile[]> {
  const files = await getMigrationFiles()
  const migrations: MigrationFile[] = []

  for (const file of files) {
    try {
      const sql = await readMigrationFile(file)
      migrations.push({
        name: file,
        path: join('supabase', 'migrations', file),
        sql,
      })
    } catch (error) {
      console.error(`마이그레이션 파일 ${file}을 읽을 수 없습니다:`, error)
    }
  }

  return migrations
}

