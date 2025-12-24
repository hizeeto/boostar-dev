import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * 세션 확인 API - 서버 사이드에서 세션을 확인
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    // Supabase 관련 쿠키 확인
    const supabaseCookies = allCookies.filter(cookie => 
      cookie.name.includes('supabase') || 
      cookie.name.includes('auth') ||
      cookie.name.includes('sb-')
    )

    const supabase = await createClient()
    
    // 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    return NextResponse.json({
      success: true,
      data: {
        cookies: {
          total: allCookies.length,
          supabase: supabaseCookies.map(c => ({
            name: c.name,
            hasValue: !!c.value,
            valueLength: c.value?.length || 0,
          })),
        },
        session: {
          exists: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          expiresAt: session?.expires_at,
          error: sessionError?.message,
        },
        user: {
          exists: !!user,
          userId: user?.id,
          email: user?.email,
          error: userError?.message,
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

