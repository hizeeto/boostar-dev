"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { setDemoSession } from "@/lib/demo-session"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isPasswordValid = password.length > 0
  const isFormValid = isEmailValid && isPasswordValid

  // 폼 제출 핸들러 - 데모용 고정 계정 로그인
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!isFormValid) {
      toast.error('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      // 데모용 고정 계정 확인
      const DEMO_EMAIL = 'mhlee@boostar.kr'
      const DEMO_PASSWORD = '0000'

      if (email.trim() === DEMO_EMAIL && password === DEMO_PASSWORD) {
        console.log('[데모 로그인] 고정 계정 로그인 시도')
        console.log('[데모 로그인] 계정 정보:', {
          email: DEMO_EMAIL,
          name: '이민형',
          uniqueCode: '1IWW96J6'
        })
        
        // 데모 세션 저장
        setDemoSession()
        
        toast.success('로그인되었습니다!', {
          description: '이민형 계정 (고유코드: 1IWW96J6)'
        })
        
        // 콘솔로 이동 (데모 계정은 온보딩 완료 상태로 가정)
        await new Promise(resolve => setTimeout(resolve, 500))
        window.location.href = '/console'
      } else {
        // 잘못된 계정 정보
        toast.error('데모용 계정 정보가 올바르지 않습니다.')
        console.log('[데모 로그인] 인증 실패')
      }
      
    } catch (error: any) {
      console.error('로그인 오류:', error)
      toast.error(error.message || '로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-semibold text-balance">Boostar에 오신 걸 환영해요</h1>
          <p className="text-muted-foreground text-sm text-balance">
            창작에만 집중하는 새로운 워크플로우를 시작하세요.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">이메일</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="example@boostar.io"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">비밀번호</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              비밀번호를 잊으셨나요?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="비밀번호를 입력해 주세요."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              <img
                src={showPassword ? "/assets/visibility_off.svg" : "/assets/visibility.svg"}
                alt={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                className="w-5 h-5"
              />
            </button>
          </div>
        </Field>
        <Field>
          <Button type="submit" disabled={!isFormValid || loading}>
            {loading ? "처리 중..." : "로그인"}
          </Button>
        </Field>
        <Field>
          <FieldDescription className="text-center">
            계정이 없으신가요?{" "}
            <a href="/signup" className="underline underline-offset-4">
              회원가입
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
