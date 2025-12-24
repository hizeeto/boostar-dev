import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * 프로필 조회 테스트 API
 * GET /api/profile-test
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // 1. 사용자 인증 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 인증 실패',
          details: {
            error: userError?.message || '사용자가 없습니다.',
            code: userError?.status || 'NO_USER',
          },
        },
        { status: 401 }
      )
    }

    // 2. 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nickname, full_name, email, avatar_url, created_at, updated_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        {
          success: false,
          error: '프로필 조회 실패',
          details: {
            error: profileError.message,
            code: profileError.code,
            hint: profileError.hint,
            user_id: user.id,
          },
        },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: '프로필이 존재하지 않습니다',
          details: {
            user_id: user.id,
            user_email: user.email,
            message: 'profiles 테이블에 해당 사용자의 레코드가 없습니다.',
          },
        },
        { status: 404 }
      )
    }

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      message: '프로필 조회 성공',
      data: {
        user: {
          id: user.id,
          email: user.email,
        },
        profile: {
          id: profile.id,
          nickname: profile.nickname,
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        },
      },
    })
  } catch (error: any) {
    console.error('[profile-test] 예상치 못한 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류',
        details: {
          message: error.message || '알 수 없는 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

