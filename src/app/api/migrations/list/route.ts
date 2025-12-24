import { NextResponse } from 'next/server'
import { getAllMigrations } from '@/lib/supabase/migrations'

/**
 * 사용 가능한 마이그레이션 파일 목록 조회
 */
export async function GET() {
  try {
    const migrations = await getAllMigrations()
    
    return NextResponse.json({
      success: true,
      migrations: migrations.map((m) => ({
        name: m.name,
        path: m.path,
        preview: m.sql.substring(0, 200) + (m.sql.length > 200 ? '...' : ''),
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || '마이그레이션 목록을 가져올 수 없습니다.',
      },
      { status: 500 }
    )
  }
}

