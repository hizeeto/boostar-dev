import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 멤버 초대 API
export async function POST(request: Request) {
  try {
    const { email, artistId, role, permission } = await request.json()

    if (!email || !artistId || !role || !permission) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 현재 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 아티스트 소유권 확인
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id, user_id')
      .eq('id', artistId)
      .single()

    if (artistError || !artist) {
      return NextResponse.json(
        { error: '아티스트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인 (소유자 또는 관리자만 초대 가능)
    const { data: member } = await supabase
      .from('artist_members')
      .select('permission')
      .eq('artist_id', artistId)
      .eq('user_id', user.id)
      .single()

    const hasPermission = 
      artist.user_id === user.id || 
      member?.permission === '전체 권한' || 
      member?.permission === '편집 권한'

    if (!hasPermission) {
      return NextResponse.json(
        { error: '멤버를 초대할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 이미 초대된 멤버인지 확인
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    if (existingProfile) {
      // 이미 회원가입한 사용자인 경우
      const { data: existingMember } = await supabase
        .from('artist_members')
        .select('id')
        .eq('artist_id', artistId)
        .eq('user_id', existingProfile.id)
        .maybeSingle()

      if (existingMember) {
        return NextResponse.json(
          { error: '이미 초대된 멤버입니다.' },
          { status: 400 }
        )
      }
    }

    // 이메일로 OTP 전송 (회원가입 유도)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3000')
    
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?invite=true&artistId=${artistId}&role=${encodeURIComponent(role)}&permission=${encodeURIComponent(permission)}`,
      },
    })

    if (otpError) {
      // 이미 회원가입한 사용자인 경우 OTP 전송 실패할 수 있음
      // 이 경우는 클라이언트에서 처리하도록 함
      return NextResponse.json(
        { 
          error: otpError.message || '초대 이메일 전송에 실패했습니다.',
          code: otpError.status || 'unknown'
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '초대 이메일이 전송되었습니다.',
    })
  } catch (error: any) {
    console.error('멤버 초대 오류:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

