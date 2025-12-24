"use client"

import { useState } from "react"
import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { setDemoSession } from "@/lib/demo-session"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreeAll, setAgreeAll] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [openTermsDialog, setOpenTermsDialog] = useState(false)
  const [openPrivacyDialog, setOpenPrivacyDialog] = useState(false)
  const [openMarketingDialog, setOpenMarketingDialog] = useState(false)

  const passwordChecks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const allChecksPassed = Object.values(passwordChecks).every(Boolean)
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isPasswordMatch = password === confirmPassword && confirmPassword !== ""
  const areRequiredTermsAgreed = agreeTerms && agreePrivacy
  const isFormValid = isEmailValid && allChecksPassed && isPasswordMatch && areRequiredTermsAgreed

  // 전체 동의 처리
  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked)
    setAgreeTerms(checked)
    setAgreePrivacy(checked)
    setAgreeMarketing(checked)
  }

  // 개별 체크박스 변경 시 전체 동의 상태 업데이트
  React.useEffect(() => {
    if (agreeTerms && agreePrivacy && agreeMarketing) {
      setAgreeAll(true)
    } else {
      setAgreeAll(false)
    }
  }, [agreeTerms, agreePrivacy, agreeMarketing])

  // 폼 제출 핸들러 - 회원가입 기능 제거, 데모 계정으로 자동 로그인
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setLoading(true)

    try {
      console.log('[데모 회원가입] 자동 로그인 시도')
      console.log('[데모 회원가입] 계정 정보:', {
        email: 'mhlee@boostar.kr',
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
      
    } catch (error: any) {
      console.error('자동 로그인 오류:', error)
      toast.error('로그인 중 오류가 발생했습니다. 관리자에게 문의하세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-semibold text-balance">Boostar 계정 만들기</h1>
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
          <FieldLabel htmlFor="password">비밀번호</FieldLabel>
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
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <div className="flex items-center gap-0.5 text-xs">
              <span className={cn("flex size-4 items-center justify-center rounded-full", passwordChecks.minLength ? "text-green-600" : "text-muted-foreground")}>
                {passwordChecks.minLength ? "✓" : "○"}
              </span>
              <span className={cn(passwordChecks.minLength ? "text-foreground" : "text-muted-foreground")}>
                8자 이상
              </span>
            </div>
            <div className="flex items-center gap-0.5 text-xs">
              <span className={cn("flex size-4 items-center justify-center rounded-full", passwordChecks.hasUpperCase ? "text-green-600" : "text-muted-foreground")}>
                {passwordChecks.hasUpperCase ? "✓" : "○"}
              </span>
              <span className={cn(passwordChecks.hasUpperCase ? "text-foreground" : "text-muted-foreground")}>
                대문자
              </span>
            </div>
            <div className="flex items-center gap-0.5 text-xs">
              <span className={cn("flex size-4 items-center justify-center rounded-full", passwordChecks.hasLowerCase ? "text-green-600" : "text-muted-foreground")}>
                {passwordChecks.hasLowerCase ? "✓" : "○"}
              </span>
              <span className={cn(passwordChecks.hasLowerCase ? "text-foreground" : "text-muted-foreground")}>
                소문자
              </span>
            </div>
            <div className="flex items-center gap-0.5 text-xs">
              <span className={cn("flex size-4 items-center justify-center rounded-full", passwordChecks.hasNumber ? "text-green-600" : "text-muted-foreground")}>
                {passwordChecks.hasNumber ? "✓" : "○"}
              </span>
              <span className={cn(passwordChecks.hasNumber ? "text-foreground" : "text-muted-foreground")}>
                숫자
              </span>
            </div>
            <div className="flex items-center gap-0.5 text-xs">
              <span className={cn("flex size-4 items-center justify-center rounded-full", passwordChecks.hasSpecialChar ? "text-green-600" : "text-muted-foreground")}>
                {passwordChecks.hasSpecialChar ? "✓" : "○"}
              </span>
              <span className={cn(passwordChecks.hasSpecialChar ? "text-foreground" : "text-muted-foreground")}>
                특수문자
              </span>
            </div>
          </div>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">비밀번호 확인</FieldLabel>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="비밀번호를 다시 입력해 주세요."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              <img
                src={showConfirmPassword ? "/assets/visibility_off.svg" : "/assets/visibility.svg"}
                alt={showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                className="w-5 h-5"
              />
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <FieldError>
              동일한 비밀번호를 입력해주세요
            </FieldError>
          )}
        </Field>
        <Field>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="agreeAll"
                checked={agreeAll}
                onCheckedChange={handleAgreeAll}
              />
              <label
                htmlFor="agreeAll"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                전체 동의
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="agreeTerms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked === true)}
              />
              <label
                htmlFor="agreeTerms"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
              >
                서비스 이용 약관
                <span className="text-destructive ml-1">(필수)</span>
              </label>
              <button
                type="button"
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                onClick={() => setOpenTermsDialog(true)}
              >
                보기
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="agreePrivacy"
                checked={agreePrivacy}
                onCheckedChange={(checked) => setAgreePrivacy(checked === true)}
              />
              <label
                htmlFor="agreePrivacy"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
              >
                개인정보 처리방침
                <span className="text-destructive ml-1">(필수)</span>
              </label>
              <button
                type="button"
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                onClick={() => setOpenPrivacyDialog(true)}
              >
                보기
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="agreeMarketing"
                checked={agreeMarketing}
                onCheckedChange={(checked) => setAgreeMarketing(checked === true)}
              />
              <label
                htmlFor="agreeMarketing"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
              >
                마케팅 수신 동의
                <span className="text-muted-foreground ml-1">(선택)</span>
              </label>
              <button
                type="button"
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                onClick={() => setOpenMarketingDialog(true)}
              >
                보기
              </button>
            </div>
          </div>
        </Field>
        <Field>
          <Button type="submit" disabled={!isFormValid || loading}>
            {loading ? "처리 중..." : "회원가입"}
          </Button>
        </Field>
        <Field>
          <FieldDescription className="text-center">
            이미 계정이 있으신가요?{" "}
            <a href="/login" className="underline underline-offset-4">
              로그인
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>

      {/* 서비스 이용 약관 Dialog */}
      <Dialog open={openTermsDialog} onOpenChange={setOpenTermsDialog}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>서비스 이용 약관</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 -mr-6 -mb-6">
            <div className="mt-4 mr-6 mb-6 space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">제1조 (목적)</h3>
              <p className="text-muted-foreground">
                본 약관은 Boostar(이하 &quot;회사&quot;)가 제공하는 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">제2조 (정의)</h3>
              <p className="text-muted-foreground">
                1. &quot;서비스&quot;란 회사가 제공하는 모든 온라인 서비스를 의미합니다.<br />
                2. &quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.<br />
                3. &quot;회원&quot;이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며, 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">제3조 (약관의 게시와 개정)</h3>
              <p className="text-muted-foreground">
                1. 회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.<br />
                2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.<br />
                3. 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스의 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">제4조 (서비스의 제공 및 변경)</h3>
              <p className="text-muted-foreground">
                1. 회사는 다음과 같은 서비스를 제공합니다.<br />
                - 창작 도구 및 워크플로우 관리 서비스<br />
                - 콘텐츠 생성 및 관리 서비스<br />
                - 기타 회사가 추가 개발하거나 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스<br />
                2. 회사는 필요한 경우 서비스의 내용을 변경할 수 있으며, 변경 시에는 사전에 공지합니다.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">제5조 (이용자의 의무)</h3>
              <p className="text-muted-foreground">
                1. 이용자는 다음 행위를 하여서는 안 됩니다.<br />
                - 신청 또는 변경 시 허위내용의 등록<br />
                - 타인의 정보 도용<br />
                - 회사가 게시한 정보의 변경<br />
                - 회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시<br />
                - 회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해<br />
                - 회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위<br />
                - 외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 공개 또는 게시하는 행위
              </p>
            </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 개인정보 처리방침 Dialog */}
      <Dialog open={openPrivacyDialog} onOpenChange={setOpenPrivacyDialog}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>개인정보 처리방침</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 -mr-6 -mb-6">
            <div className="mt-4 mr-6 mb-6 space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">제1조 (개인정보의 처리 목적)</h3>
              <p className="text-muted-foreground">
                회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.<br /><br />
                1. 회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지, 고충처리 목적<br />
                2. 재화 또는 서비스 제공: 서비스 제공, 콘텐츠 제공, 맞춤서비스 제공, 본인인증, 요금결제·정산<br />
                3. 마케팅 및 광고에의 활용: 신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">제2조 (개인정보의 처리 및 보유기간)</h3>
              <p className="text-muted-foreground">
                1. 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.<br />
                2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.<br />
                - 회원 가입 및 관리: 회원 탈퇴 시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료 시까지)<br />
                - 재화 또는 서비스 제공: 재화·서비스 공급완료 및 요금결제·정산 완료 시까지<br />
                - 마케팅 및 광고에의 활용: 회원 탈퇴 시까지 또는 동의 철회 시까지
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">제3조 (처리하는 개인정보의 항목)</h3>
              <p className="text-muted-foreground">
                회사는 다음의 개인정보 항목을 처리하고 있습니다.<br /><br />
                1. 회원 가입 및 관리<br />
                - 필수항목: 이메일, 비밀번호, 닉네임<br />
                - 선택항목: 프로필 사진, 생년월일<br /><br />
                2. 재화 또는 서비스 제공<br />
                - 필수항목: 이메일, 결제정보<br />
                - 자동 수집 항목: IP주소, 쿠키, MAC주소, 서비스 이용 기록, 방문 기록, 불량 이용 기록 등<br /><br />
                3. 마케팅 및 광고에의 활용<br />
                - 선택항목: 이메일, 휴대전화번호, 성별, 생년월일
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">제4조 (개인정보의 제3자 제공)</h3>
              <p className="text-muted-foreground">
                1. 회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.<br />
                2. 회사는 원칙적으로 정보주체의 개인정보를 제3자에게 제공하지 않습니다.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">제5조 (개인정보처리의 위탁)</h3>
              <p className="text-muted-foreground">
                1. 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.<br />
                2. 회사는 위탁계약 체결 시 개인정보 보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">제6조 (정보주체의 권리·의무 및 그 행사방법)</h3>
              <p className="text-muted-foreground">
                1. 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.<br />
                - 개인정보 처리정지 요구권<br />
                - 개인정보 열람요구권<br />
                - 개인정보 정정·삭제요구권<br />
                - 개인정보 처리정지 요구권<br />
                2. 제1항에 따른 권리 행사는 회사에 대해 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.
              </p>
            </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 마케팅 수신 동의 Dialog */}
      <Dialog open={openMarketingDialog} onOpenChange={setOpenMarketingDialog}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>마케팅 수신 동의</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 -mr-6 -mb-6">
            <div className="mt-4 mr-6 mb-6 space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">제1조 (마케팅 정보 수신 동의)</h3>
              <p className="text-muted-foreground">
                1. 회사는 이용자의 동의를 받아 마케팅 및 광고에 활용할 목적으로 개인정보를 수집·이용할 수 있습니다.<br />
                2. 마케팅 정보 수신 동의는 선택사항이며, 동의하지 않아도 서비스 이용에는 제한이 없습니다.<br />
                3. 마케팅 정보 수신 동의를 하신 경우에도 언제든지 동의를 철회하실 수 있습니다.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">제2조 (마케팅 정보 수신 방법)</h3>
              <p className="text-muted-foreground">
                회사는 다음과 같은 방법으로 마케팅 정보를 제공할 수 있습니다.<br />
                - 이메일<br />
                - SMS/MMS<br />
                - 푸시 알림<br />
                - 앱 내 알림
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">제3조 (마케팅 정보의 내용)</h3>
              <p className="text-muted-foreground">
                회사가 제공하는 마케팅 정보는 다음과 같습니다.<br />
                - 신규 서비스 및 기능 안내<br />
                - 이벤트 및 프로모션 정보<br />
                - 맞춤형 광고 및 추천 콘텐츠<br />
                - 설문조사 및 리서치 참여 안내
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">제4조 (동의 철회)</h3>
              <p className="text-muted-foreground">
                1. 마케팅 정보 수신 동의는 언제든지 철회하실 수 있습니다.<br />
                2. 동의 철회는 회원정보 수정 페이지에서 가능하며, 이메일 수신 거부는 각 이메일 하단의 수신거부 링크를 통해 가능합니다.<br />
                3. 동의를 철회하더라도 서비스 이용에는 제한이 없습니다.
              </p>
            </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </form>
  )
}

