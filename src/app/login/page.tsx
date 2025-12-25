"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getDemoSession } from "@/lib/demo-session"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // 자동 로그인이 적용되어 있으므로 즉시 콘솔로 리다이렉트
    const session = getDemoSession()
    if (session) {
      console.log('[로그인 페이지] 자동 로그인 감지, 콘솔로 리다이렉트')
      router.push('/console')
    }
  }, [router])

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <img
              src="/assets/BI_signature.svg"
              alt="Boostar"
              className="h-6"
            />
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/assets/sign-up_image.jpg"
          alt="Boostar"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
