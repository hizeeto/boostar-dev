"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      const MAX_RETRIES = 3
      let retryCount = 0

      const attemptAuth = async (): Promise<void> => {
        try {
          // URL 해시 확인 (Supabase 이메일 인증 링크는 해시에 토큰을 포함)
          const hash = window.location.hash.substring(1)
          
          if (hash) {
            const hashParams = new URLSearchParams(hash)
            const accessToken = hashParams.get('access_token')
            const refreshToken = hashParams.get('refresh_token')
            const error = hashParams.get('error')
            const errorDescription = hashParams.get('error_description')
            const type = hashParams.get('type')

            // 오류가 있는 경우
            if (error) {
              // 특정 오류 메시지 처리
              if (error === 'token_expired') {
                throw new Error('인증 링크가 만료되었습니다. 새로운 인증 링크를 요청해주세요.')
              } else if (error === 'invalid_token') {
                throw new Error('유효하지 않은 인증 링크입니다.')
              } else if (error === 'email_not_confirmed') {
                throw new Error('이메일 인증이 완료되지 않았습니다.')
              }
              throw new Error(errorDescription || error || '인증 중 오류가 발생했습니다.')
            }

            // 해시에 토큰이 있는 경우 세션 설정
            if (accessToken && refreshToken) {
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              })

              if (sessionError) {
                // 세션 오류 처리
                if (sessionError.message?.includes('expired')) {
                  throw new Error('인증 링크가 만료되었습니다. 새로운 인증 링크를 요청해주세요.')
                } else if (sessionError.message?.includes('invalid')) {
                  throw new Error('유효하지 않은 인증 링크입니다.')
                }
                throw sessionError
              }

              // 세션이 제대로 설정되었는지 확인
              if (!sessionData.session) {
                throw new Error('세션 설정에 실패했습니다.')
              }

              console.log('세션 설정 성공:', {
                userId: sessionData.session.user?.id,
                email: sessionData.session.user?.email,
              })

              // 해시 제거 (보안 및 깔끔한 URL을 위해)
              window.history.replaceState(null, '', window.location.pathname)
              
              // 세션이 쿠키에 저장될 시간을 확보 (중요!)
              // 브라우저가 쿠키를 저장하는 데 시간이 필요함
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              // 세션 확인 (쿠키에 제대로 저장되었는지)
              const { data: { session: verifiedSession }, error: sessionCheckError } = await supabase.auth.getSession()
              
              if (sessionCheckError) {
                console.error('세션 확인 오류:', sessionCheckError)
                throw new Error('세션 확인 중 오류가 발생했습니다.')
              }
              
              if (!verifiedSession) {
                console.error('세션이 저장되지 않음')
                throw new Error('세션이 제대로 저장되지 않았습니다.')
              }
              
              console.log('세션 확인 완료:', {
                userId: verifiedSession.user?.id,
                expiresAt: verifiedSession.expires_at,
              })
            } else if (type === 'recovery' || type === 'invite') {
              // 비밀번호 재설정 또는 초대 링크인 경우
              // 이 경우는 별도로 처리할 수 있지만, 일단 기본 플로우를 따름
            }
          }
          
          // 해시가 없거나 이미 처리된 경우, 세션 확인을 위해 잠시 대기
          // Supabase 클라이언트가 자동으로 처리했을 수 있음
          await new Promise(resolve => setTimeout(resolve, 500))

          // 세션 설정 후 사용자 정보 가져오기
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (userError) {
            // 사용자 정보 가져오기 실패 시 재시도
            if (retryCount < MAX_RETRIES && userError.message?.includes('session')) {
              retryCount++
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
              return attemptAuth()
            }
            throw userError
          }

          if (!user) {
            // 인증 실패 - 재시도
            if (retryCount < MAX_RETRIES) {
              retryCount++
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
              return attemptAuth()
            }
            throw new Error('인증에 실패했습니다. 다시 시도해주세요.')
          }

          // 이메일 인증 상태 확인
          if (!user.email_confirmed_at) {
            // 이메일이 아직 인증되지 않은 경우 (드물지만 발생할 수 있음)
            console.warn('이메일이 아직 인증되지 않았습니다.')
          }

          // 프로필 정보 확인 (온보딩 완료 여부)
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .maybeSingle()

          // 프로필이 없는 경우는 정상 (온보딩에서 생성)
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('프로필 조회 오류:', profileError)
          }

          toast.success('이메일 인증이 완료되었습니다!')

          // 온보딩 완료 여부에 따라 리다이렉트
          // 페이지 리로드를 통해 미들웨어가 세션을 인식하도록 함
          if (!profileData || !profileData.onboarding_completed) {
            // 전체 페이지 리로드를 통해 미들웨어가 세션을 인식하도록 함
            window.location.href = '/onboarding'
          } else {
            window.location.href = '/console'
          }
        } catch (err: any) {
          console.error('인증 콜백 처리 오류:', err)
          
          // 최종 재시도
          if (retryCount < MAX_RETRIES && err.message?.includes('session')) {
            retryCount++
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
            return attemptAuth()
          }

          // 에러 메시지 설정
          const errorMessage = err.message || '인증 처리 중 오류가 발생했습니다.'
          setError(errorMessage)
          toast.error(errorMessage)
          
          // 세션이 설정되지 않은 경우에만 로그인 페이지로 리다이렉트
          // 세션이 설정된 경우 온보딩으로 이동 시도
          const { data: { session: finalSession } } = await supabase.auth.getSession()
          if (finalSession) {
            // 세션이 있으면 온보딩으로 이동
            console.log('세션이 설정되어 있으므로 온보딩으로 이동합니다.')
            window.location.href = '/onboarding'
          } else {
            // 세션이 없으면 로그인 페이지로 리다이렉트
            setTimeout(() => {
              window.location.href = '/login'
            }, 3000)
          }
        }
      }

      // 타임아웃 설정 (30초)
      const timeout = setTimeout(() => {
        if (loading) {
          setError('인증 처리 시간이 초과되었습니다.')
          toast.error('인증 처리 시간이 초과되었습니다. 다시 시도해주세요.')
          router.push('/login')
        }
      }, 30000)

      attemptAuth().finally(() => {
        clearTimeout(timeout)
        setLoading(false)
      })
    }

    handleAuthCallback()
  }, [router, supabase, searchParams])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
            <p className="text-muted-foreground text-center">
              인증 처리 중...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-destructive text-center font-medium">
              {error}
            </p>
            <p className="text-muted-foreground text-center text-sm">
              로그인 페이지로 이동합니다...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
            <p className="text-muted-foreground text-center">
              리다이렉트 중...
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

