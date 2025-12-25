"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getDemoSession } from "@/lib/demo-session"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // 데모 세션이 있으면 즉시 콘솔로 리다이렉트
        const demoSession = getDemoSession()
        if (demoSession) {
          console.log('[메인 페이지] 자동 로그인 감지, 콘솔로 리다이렉트')
          router.replace('/console')
          return
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        // 로그인하지 않은 경우 홈 화면 표시
        if (userError || !user) {
          setLoading(false)
          return
        }

        setUser(user)

        // 프로필 정보 가져오기
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!profileError && profileData) {
          setProfile(profileData)
          
          // 온보딩 완료 여부에 따라 리다이렉트
          if (!profileData.onboarding_completed) {
            // 온보딩 미완료 → 온보딩으로 이동
            router.replace('/onboarding')
            return
          } else {
            // 온보딩 완료 → 콘솔로 이동
            router.replace('/console')
            return
          }
        } else if (profileError && profileError.code === 'PGRST116') {
          // 프로필이 없는 경우 → 온보딩으로 이동
          router.replace('/onboarding')
          return
        }
      } catch (error) {
        console.error('사용자 정보 로딩 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router, supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('로그아웃되었습니다.')
      router.push('/login')
    } catch (error) {
      toast.error('로그아웃 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <p className="text-muted-foreground">로딩 중...</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Boostar에 오신 것을 환영합니다
        </h1>
        
        {user ? (
          // 로그인한 사용자
          <>
            {profile && (
              <div className="mt-8 p-6 bg-muted rounded-lg">
                <h2 className="text-2xl font-semibold mb-4">프로필 정보</h2>
                <div className="space-y-2">
                  {profile.nickname && <p><strong>닉네임:</strong> {profile.nickname}</p>}
                  {profile.full_name && <p><strong>이름:</strong> {profile.full_name}</p>}
                  {profile.email && <p><strong>이메일:</strong> {profile.email}</p>}
                  {profile.phone && <p><strong>전화번호:</strong> {profile.phone}</p>}
                  {profile.gender && <p><strong>성별:</strong> {profile.gender === 'male' ? '남성' : '여성'}</p>}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-center gap-4">
              <Button onClick={handleLogout} variant="outline">
                로그아웃
              </Button>
            </div>
          </>
        ) : (
          // 로그인하지 않은 사용자
          <div className="mt-8 flex flex-col items-center gap-6">
            <p className="text-center text-lg text-muted-foreground">
              Boostar의 모든 기능을 이용하려면 로그인하세요
            </p>
            <div className="flex gap-4">
              <Button onClick={() => router.push('/login')} size="lg">
                로그인
              </Button>
              <Button onClick={() => router.push('/signup')} variant="outline" size="lg">
                회원가입
              </Button>
            </div>
          </div>
        )}

        <p className="text-center text-muted-foreground mt-8">
          Next.js, Supabase, shadcn/ui로 구축된 웹서비스
        </p>
      </div>
    </main>
  )
}

