import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 환경 변수가 없으면 세션 업데이트를 건너뛰고 요청을 그대로 통과시킴
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  // 요청에서 쿠키 확인 (개발 환경에서만 디버깅)
  if (process.env.NODE_ENV === 'development') {
    const requestCookies = request.cookies.getAll()
    const authCookies = requestCookies.filter(c => 
      c.name.includes('sb-') || c.name.includes('supabase')
    )
    
    console.log('[Middleware] 요청 쿠키:', {
      total: requestCookies.length,
      authCookies: authCookies.map(c => ({ 
        name: c.name, 
        hasValue: !!c.value,
        valueLength: c.value?.length,
        valueStart: c.value?.substring(0, 50) + '...',
      })),
    })
    
    // 쿠키 내용을 파싱해서 확인
    if (authCookies.length > 0) {
      try {
        const cookieValue = authCookies[0].value
        const parts = cookieValue.split('.')
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]))
          console.log('[Middleware] 쿠키 페이로드:', {
            sub: payload.sub?.substring(0, 8) + '...',
            exp: payload.exp,
            isExpired: payload.exp ? payload.exp < Date.now() / 1000 : null,
            iss: payload.iss,
          })
        }
      } catch (e) {
        console.error('[Middleware] 쿠키 파싱 실패:', e)
      }
    }
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // 먼저 세션 확인
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (process.env.NODE_ENV === 'development') {
    if (sessionError) {
      console.error('[Middleware] 세션 오류:', sessionError.message, sessionError.status)
    }
    
    console.log('[Middleware] 세션 상태:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionExpiry: session?.expires_at,
      isExpired: session?.expires_at ? new Date(session.expires_at) < new Date() : null,
    })
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (process.env.NODE_ENV === 'development' && userError) {
    console.error('[Middleware] 사용자 오류:', userError.message, userError.status)
  }

  const pathname = request.nextUrl.pathname
  
  // 데모 세션 확인
  const demoUserCookie = request.cookies.get('boostar_demo_user')
  const isDemoUser = !!demoUserCookie
  
  // 디버깅 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware]', {
      pathname,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      isDemoUser,
      demoUserId: demoUserCookie?.value,
    })
  }
  
  // 공개 페이지 경로들
  const publicPaths = ['/', '/login', '/signup', '/test-supabase', '/api', '/auth']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // 인증 콜백 페이지는 항상 접근 가능 (세션 설정 중일 수 있음)
  if (pathname === '/auth/callback') {
    return supabaseResponse
  }

  // 인증되지 않은 사용자가 보호된 페이지에 접근하려는 경우
  // 데모 사용자는 인증된 것으로 처리
  if (!user && !isDemoUser && !isPublicPath) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] 인증되지 않은 사용자, 로그인 페이지로 리다이렉트:', pathname)
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 인증된 사용자가 로그인/회원가입 페이지에 접근하려는 경우
  if ((user || isDemoUser) && (pathname === '/login' || pathname === '/signup')) {
    // 홈 화면으로 리다이렉트
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // 온보딩 페이지 접근 시 체크
  // 데모 사용자는 온보딩 완료로 간주
  if (user && pathname === '/onboarding') {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    // 이미 온보딩을 완료한 경우 메인 페이지로
    if (profileData && profileData.onboarding_completed) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }
  
  // 데모 사용자가 온보딩 페이지에 접근하려는 경우 메인 페이지로
  if (isDemoUser && pathname === '/onboarding') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}

