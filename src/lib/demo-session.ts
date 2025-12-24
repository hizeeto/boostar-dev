// 데모 세션 관리 유틸리티
export interface DemoUser {
  id: string
  email: string
  full_name: string
  nickname: string
  unique_code: string
}

export interface DemoSession {
  user: DemoUser
  isDemo: true
  timestamp: number
}

export const DEMO_USER_ID = '1269fa39-fd8b-4eac-aef2-ff54f36c9a0a'
export const DEMO_UNIQUE_CODE = '1IWW96J6'
export const DEMO_USER: DemoUser = {
  id: DEMO_USER_ID,
  email: 'mhlee@boostar.kr',
  full_name: '이민형',
  nickname: '이민형',
  unique_code: DEMO_UNIQUE_CODE,
}

/**
 * 쿠키에서 데모 사용자 ID 추출
 */
function getDemoUserIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'boostar_demo_user') {
      return value
    }
  }
  return null
}

/**
 * 데모 세션 가져오기 (자동 복구 포함)
 */
export function getDemoSession(): DemoSession | null {
  if (typeof window === 'undefined') return null
  
  try {
    const sessionStr = localStorage.getItem('boostar_demo_session')
    
    // localStorage에 세션이 있는 경우
    if (sessionStr) {
      const session = JSON.parse(sessionStr) as DemoSession
      
      // 24시간 이상 지난 세션은 무효화
      const now = Date.now()
      const sessionAge = now - session.timestamp
      const maxAge = 24 * 60 * 60 * 1000 // 24시간
      
      if (sessionAge > maxAge) {
        clearDemoSession()
        return null
      }
      
      return session
    }
    
    // localStorage에 세션이 없지만 쿠키에 데모 사용자 ID가 있는 경우 자동 복구
    const cookieUserId = getDemoUserIdFromCookie()
    if (cookieUserId === DEMO_USER_ID) {
      console.log('[데모 세션] 쿠키에서 세션 자동 복구 중...')
      setDemoSession()
      
      // 복구된 세션 반환
      const newSessionStr = localStorage.getItem('boostar_demo_session')
      if (newSessionStr) {
        return JSON.parse(newSessionStr) as DemoSession
      }
    }
    
    return null
  } catch (error) {
    console.error('[데모 세션] 세션 읽기 오류:', error)
    return null
  }
}

/**
 * 데모 세션 저장
 */
export function setDemoSession(): void {
  if (typeof window === 'undefined') return
  
  const session: DemoSession = {
    user: DEMO_USER,
    isDemo: true,
    timestamp: Date.now(),
  }
  
  try {
    localStorage.setItem('boostar_demo_session', JSON.stringify(session))
    document.cookie = `boostar_demo_user=${DEMO_USER_ID}; path=/; max-age=86400; SameSite=Lax`
    console.log('[데모 세션] 세션 저장 완료')
  } catch (error) {
    console.error('[데모 세션] 세션 저장 오류:', error)
  }
}

/**
 * 데모 세션 삭제
 */
export function clearDemoSession(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('boostar_demo_session')
    document.cookie = 'boostar_demo_user=; path=/; max-age=0; SameSite=Lax'
    console.log('[데모 세션] 세션 삭제 완료')
  } catch (error) {
    console.error('[데모 세션] 세션 삭제 오류:', error)
  }
}

/**
 * 현재 사용자가 데모 사용자인지 확인
 */
export function isDemoUser(): boolean {
  return getDemoSession() !== null
}

/**
 * 데모 사용자 정보 가져오기
 */
export function getDemoUser(): DemoUser | null {
  const session = getDemoSession()
  return session ? session.user : null
}

