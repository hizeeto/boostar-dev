import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * 인증 디버깅 API
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const authCookies = allCookies.filter(c => 
      c.name.includes('sb-') || c.name.includes('supabase')
    )

    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const projectId = supabaseUrl?.split('//')[1]?.split('.')[0]

    // 쿠키에서 프로젝트 ID 추출
    const cookieProjectIds = authCookies.map(c => {
      const match = c.name.match(/sb-([a-z]+)-/)
      return match ? match[1] : null
    })

    // Supabase 클라이언트로 세션 확인
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // 쿠키 내용 파싱
    let cookiePayload = null
    if (authCookies.length > 0) {
      try {
        const parts = authCookies[0].value.split('-')
        if (parts.length > 0) {
          // base64 토큰 디코드
          const token = parts[parts.length - 1]
          const tokenParts = token.split('.')
          if (tokenParts.length >= 2) {
            cookiePayload = JSON.parse(atob(tokenParts[1]))
          }
        }
      } catch (e: any) {
        cookiePayload = { error: e.message }
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl,
        hasAnonKey,
        projectId,
      },
      cookies: {
        total: allCookies.length,
        authCookies: authCookies.map(c => ({
          name: c.name,
          valueLength: c.value.length,
        })),
        projectIds: cookieProjectIds,
      },
      cookiePayload: cookiePayload ? {
        sub: cookiePayload.sub,
        exp: cookiePayload.exp,
        expDate: cookiePayload.exp ? new Date(cookiePayload.exp * 1000).toISOString() : null,
        isExpired: cookiePayload.exp ? cookiePayload.exp < Date.now() / 1000 : null,
        iss: cookiePayload.iss,
      } : null,
      session: {
        exists: !!session,
        userId: session?.user?.id,
        expires: session?.expires_at,
        error: sessionError?.message,
      },
      user: {
        exists: !!user,
        userId: user?.id,
        email: user?.email,
        error: userError?.message,
      },
      diagnosis: {
        cookieExists: authCookies.length > 0,
        projectIdMatch: projectId && cookieProjectIds.includes(projectId),
        sessionFromCookie: !!session,
        userFromSession: !!user,
        problem: !session ? 'SESSION_NOT_CREATED_FROM_COOKIE' : 
                 !user ? 'USER_NOT_LOADED' : 
                 'OK',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}

