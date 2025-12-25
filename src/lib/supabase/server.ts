import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    )
  }

  // 디버깅 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    const allCookies = cookieStore.getAll()
    console.log('[createClient - Server] 총 쿠키 개수:', allCookies.length)
    
    const authCookies = allCookies.filter(c => 
      c.name.includes('sb-') || c.name.includes('supabase') || c.name.includes('auth')
    )
    
    if (authCookies.length > 0) {
      console.log('[createClient - Server] 인증 쿠키 발견:', authCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
      })))
    } else {
      console.warn('[createClient - Server] 인증 쿠키가 없습니다!')
    }
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            // 서버 컴포넌트에서는 쿠키 설정이 제한될 수 있음
          }
        },
      },
    }
  )
}

