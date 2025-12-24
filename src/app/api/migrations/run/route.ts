import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Supabase 마이그레이션 실행 API
 * 
 * 보안 주의: 프로덕션 환경에서는 이 API를 비활성화하거나
 * 강력한 인증을 추가해야 합니다.
 * 
 * 사용법:
 * POST /api/migrations/run
 * Body: { migrationFile: "add_is_archived_to_projects.sql" }
 */
export async function POST(request: NextRequest) {
  try {
    // 개발 환경에서만 허용 (선택사항)
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: '프로덕션 환경에서는 마이그레이션을 실행할 수 없습니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { migrationFile } = body

    if (!migrationFile) {
      return NextResponse.json(
        { success: false, error: 'migrationFile이 필요합니다.' },
        { status: 400 }
      )
    }

    // Supabase 서비스 키 확인
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!supabaseServiceKey || !supabaseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase 서비스 키가 설정되지 않았습니다. .env.local에 SUPABASE_SERVICE_ROLE_KEY를 추가하세요.',
        },
        { status: 500 }
      )
    }

    // 마이그레이션 파일 읽기
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', migrationFile)
    let sql: string

    try {
      sql = await readFile(migrationPath, 'utf-8')
    } catch (error) {
      return NextResponse.json(
        { success: false, error: `마이그레이션 파일을 읽을 수 없습니다: ${migrationFile}` },
        { status: 404 }
      )
    }

    // Supabase Management API를 사용하여 SQL 실행
    // 참고: Supabase는 PostgREST를 사용하므로 직접 SQL 실행이 제한적입니다.
    // 대신 Supabase REST API의 rpc 함수를 사용하거나,
    // Supabase CLI를 사용하는 것이 권장됩니다.
    
    // 여기서는 Supabase의 PostgREST API를 통해 실행하려고 시도합니다.
    // 하지만 DDL 문은 일반적으로 PostgREST를 통해 실행할 수 없으므로,
    // Supabase Dashboard의 SQL Editor를 사용하거나 Supabase CLI를 사용해야 합니다.

    // 대안: Supabase Management API를 직접 호출
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql }),
    })

    if (!response.ok) {
      // exec_sql 함수가 없을 수 있으므로, 다른 방법을 시도합니다.
      // 실제로는 Supabase CLI를 사용하거나 Dashboard를 사용해야 합니다.
      const errorText = await response.text()
      return NextResponse.json(
        {
          success: false,
          error: 'SQL 실행에 실패했습니다. Supabase CLI를 사용하거나 Dashboard의 SQL Editor를 사용하세요.',
          details: errorText,
        },
        { status: 500 }
      )
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: `마이그레이션 ${migrationFile}이(가) 성공적으로 실행되었습니다.`,
      result,
    })
  } catch (error: any) {
    console.error('마이그레이션 실행 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '마이그레이션 실행 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

