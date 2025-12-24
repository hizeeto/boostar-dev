import { Suspense } from "react"
import { cookies } from "next/headers"
import { ConsoleLayout } from "@/components/console-layout"
import { createClient } from "@/lib/supabase/server"
import { ArtistProvider } from "@/hooks/use-artist-context"
import { ProjectsProvider } from "@/hooks/use-projects-context"
import { DEMO_USER } from "@/lib/demo-session"

async function getUserProfile() {
  try {
    // 데모 세션 확인 (쿠키에서)
    const cookieStore = await cookies()
    const demoUserCookie = cookieStore.get('boostar_demo_user')
    
    if (demoUserCookie) {
      console.log('[getUserProfile] 데모 사용자 감지:', demoUserCookie.value)
      
      // DB에서 실제 프로필 데이터 조회
      const supabase = await createClient()
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('nickname, full_name, email, avatar_url')
        .eq('id', DEMO_USER.id)
        .single()
      
      if (profile) {
        console.log('[getUserProfile] 데모 프로필 데이터 조회 성공')
        return {
          name: profile.nickname || profile.full_name || DEMO_USER.full_name,
          email: profile.email || DEMO_USER.email,
          avatar: profile.avatar_url || '',
        }
      } else {
        console.warn('[getUserProfile] 데모 프로필 조회 실패, 기본값 사용')
        return {
          name: DEMO_USER.full_name,
          email: DEMO_USER.email,
          avatar: '',
        }
      }
    }
    
    const supabase = await createClient()
    
    // 먼저 세션을 확인 (getSession이 getUser보다 더 안정적)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('[getUserProfile] 세션 오류:', {
        message: sessionError.message,
        status: sessionError.status,
        name: sessionError.name,
      })
    }
    
    console.log('[getUserProfile] 세션 디버그:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionExpiry: session?.expires_at,
      isExpired: session?.expires_at ? new Date(session.expires_at) < new Date() : null,
      errorMessage: sessionError?.message,
    })
    
    if (!session) {
      console.warn('[getUserProfile] 세션이 없습니다. 로그인이 필요합니다.')
      console.warn('[getUserProfile] 쿠키는 있지만 유효한 세션으로 변환되지 않음')
      return {
        name: 'User',
        email: '',
        avatar: '',
      }
    }
    
    // 세션에서 사용자 정보 가져오기
    const user = session.user
    
    if (!user) {
      console.warn('[getUserProfile] 세션은 있지만 사용자 정보가 없습니다.')
      return {
        name: 'User',
        email: '',
        avatar: '',
      }
    }

    console.log('[getUserProfile] 사용자 ID:', user.id)
    console.log('[getUserProfile] 사용자 이메일:', user.email)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nickname, full_name, email, avatar_url')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[getUserProfile] 프로필 조회 오류:', profileError.message)
      console.error('[getUserProfile] 프로필 조회 오류 코드:', profileError.code)
      // 프로필이 없으면 기본값 반환
      return {
        name: user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatar: '',
      }
    }

    if (!profile) {
      console.warn('[getUserProfile] 프로필 데이터가 없습니다. 사용자 ID:', user.id)
      return {
        name: user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatar: '',
      }
    }

    console.log('[getUserProfile] 프로필 데이터 조회 성공:', {
      nickname: profile.nickname,
      full_name: profile.full_name,
      email: profile.email,
      has_avatar: !!profile.avatar_url,
    })

    // 프로필 정보 매핑
    return {
      name: profile.nickname || profile.full_name || user.email?.split('@')[0] || 'User',
      email: profile.email || user.email || '',
      avatar: profile.avatar_url || '',
    }
  } catch (error: any) {
    console.error('[getUserProfile] 예상치 못한 오류:', error)
    return {
      name: 'User',
      email: '',
      avatar: '',
    }
  }
}

async function ConsoleLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const userProfile = await getUserProfile()
  return <ConsoleLayout user={userProfile}>{children}</ConsoleLayout>
}

export default function ConsoleLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ArtistProvider>
      <ProjectsProvider>
        <Suspense fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          </div>
        }>
          <ConsoleLayoutWrapper>{children}</ConsoleLayoutWrapper>
        </Suspense>
      </ProjectsProvider>
    </ArtistProvider>
  )
}

