"use client"

import { useEffect } from 'react'
import { setDemoSession, getDemoSession } from '@/lib/demo-session'

/**
 * 자동 로그인 프로바이더
 * 앱 시작 시 자동으로 데모 계정(mhlee@boostar.kr)으로 로그인
 */
export function AutoLoginProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 이미 데모 세션이 있는지 확인
    const existingSession = getDemoSession()
    
    if (!existingSession) {
      // 세션이 없으면 자동으로 생성
      console.log('[자동 로그인] mhlee@boostar.kr 계정으로 자동 로그인 중...')
      setDemoSession()
    } else {
      console.log('[자동 로그인] 기존 세션 유지:', existingSession.user.email)
    }
  }, [])

  return <>{children}</>
}

