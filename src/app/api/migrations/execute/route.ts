import { NextRequest, NextResponse } from 'next/server'
import { readMigrationFile } from '@/lib/supabase/migrations'
import { createClient } from '@supabase/supabase-js'

/**
 * Supabase 마이그레이션 실행 API
 * 
 * 주의: Supabase의 일반 클라이언트로는 DDL 문을 실행할 수 없습니다.
 * 이 API는 마이그레이션 파일의 SQL을 Supabase Dashboard에 표시하기 위한 것입니다.
 * 
 * 실제 마이그레이션 실행은:
 * 1. Supabase Dashboard의 SQL Editor에서 수동 실행
 * 2. Supabase CLI 사용: `supabase db push`
 * 
 * 사용법:
 * POST /api/migrations/execute
 * Body: { migrationFile: "add_is_archived_to_projects.sql" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { migrationFile } = body

    if (!migrationFile) {
      return NextResponse.json(
        { success: false, error: 'migrationFile이 필요합니다.' },
        { status: 400 }
      )
    }

    // 마이그레이션 파일 읽기
    const sql = await readMigrationFile(migrationFile)

    // Supabase 서비스 키 확인
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!supabaseServiceKey || !supabaseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase 서비스 키가 설정되지 않았습니다.',
          instructions: [
            '1. Supabase Dashboard > Settings > API로 이동',
            '2. service_role 키를 복사',
            '3. .env.local에 SUPABASE_SERVICE_ROLE_KEY=your-service-key 추가',
            '4. 또는 Supabase CLI를 사용: supabase db push',
          ],
          sql, // SQL을 반환하여 사용자가 수동으로 실행할 수 있도록
        },
        { status: 500 }
      )
    }

    // Supabase Management API를 사용하여 SQL 실행 시도
    // 참고: PostgREST는 DDL을 지원하지 않으므로, 실제로는 작동하지 않을 수 있습니다.
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // SQL을 여러 문으로 분리
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    const results = []
    const errors = []

    for (const statement of statements) {
      try {
        // PostgREST는 DDL을 지원하지 않으므로, 이 방법은 작동하지 않을 수 있습니다.
        // 대신 사용자에게 SQL을 반환하여 수동으로 실행하도록 안내합니다.
        results.push({
          statement: statement.substring(0, 100) + '...',
          status: 'skipped',
          message: 'DDL 문은 PostgREST를 통해 실행할 수 없습니다.',
        })
      } catch (error: any) {
        errors.push({
          statement: statement.substring(0, 100) + '...',
          error: error.message,
        })
      }
    }

    // DDL 문은 실행할 수 없으므로, SQL을 반환하여 사용자가 수동으로 실행하도록 안내
    return NextResponse.json({
      success: false,
      message: 'DDL 문은 API를 통해 자동 실행할 수 없습니다.',
      instructions: [
        'Supabase는 PostgREST를 사용하므로 DDL 문(CREATE, ALTER 등)을 직접 실행할 수 없습니다.',
        '다음 방법 중 하나를 사용하세요:',
        '',
        '방법 1: Supabase Dashboard',
        '1. Supabase Dashboard > SQL Editor로 이동',
        '2. 아래 SQL을 복사하여 붙여넣기',
        '3. 실행 버튼 클릭',
        '',
        '방법 2: Supabase CLI (권장)',
        '1. supabase CLI 설치: npm install -g supabase',
        '2. supabase login',
        '3. supabase link --project-ref your-project-ref',
        '4. supabase db push',
        '',
        '방법 3: 이 프로젝트의 마이그레이션 스크립트 사용',
        'npm run migrate 또는 직접 마이그레이션 파일 실행',
      ],
      sql,
      migrationFile,
      results,
      errors: errors.length > 0 ? errors : undefined,
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

