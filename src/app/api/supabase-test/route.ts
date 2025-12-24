import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // 환경 변수 검증
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          success: false,
          error: '환경 변수가 설정되지 않았습니다.',
          details: {
            urlPresent: !!supabaseUrl,
            keyPresent: !!supabaseAnonKey,
          },
        },
        { status: 500 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = await createClient()

    // 인증 서비스 테스트
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    // 연결 정보
    const connectionInfo = {
      url: supabaseUrl,
      urlValid: supabaseUrl.includes('supabase.co') && supabaseUrl.startsWith('https://'),
      keyLength: supabaseAnonKey.length,
      authService: sessionError ? 'error' : 'ok',
      authError: sessionError?.message || null,
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase 연결이 정상입니다.',
      connectionInfo,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

