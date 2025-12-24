/**
 * Supabase 연결 상태를 확인하는 유틸리티 함수
 */

export interface SupabaseHealthCheck {
  connected: boolean
  urlValid: boolean
  keyPresent: boolean
  message: string
  details?: {
    url?: string
    keyLength?: number
    error?: string
  }
}

/**
 * 환경 변수를 기반으로 Supabase 연결 상태를 확인합니다
 */
export function checkSupabaseConfig(): SupabaseHealthCheck {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 환경 변수 존재 여부 확인
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      connected: false,
      urlValid: false,
      keyPresent: false,
      message: '환경 변수가 설정되지 않았습니다.',
      details: {
        error: 'NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 없습니다.',
      },
    }
  }

  // URL 형식 검증
  let urlValid = false
  try {
    const url = new URL(supabaseUrl)
    urlValid = url.protocol === 'https:' && url.hostname.includes('supabase.co')
  } catch {
    urlValid = false
  }

  // Key 길이 검증 (일반적으로 Supabase anon key는 최소 100자 이상)
  const keyPresent = supabaseAnonKey.trim().length > 0
  const keyLength = supabaseAnonKey.length

  if (!urlValid) {
    return {
      connected: false,
      urlValid: false,
      keyPresent,
      message: 'Supabase URL 형식이 올바르지 않습니다.',
      details: {
        url: supabaseUrl,
        keyLength,
        error: 'URL은 https://로 시작하고 supabase.co를 포함해야 합니다.',
      },
    }
  }

  if (!keyPresent) {
    return {
      connected: false,
      urlValid: true,
      keyPresent: false,
      message: 'Supabase Anon Key가 비어있습니다.',
      details: {
        url: supabaseUrl,
        keyLength: 0,
        error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY에 값을 입력하세요.',
      },
    }
  }

  return {
    connected: true,
    urlValid: true,
    keyPresent: true,
    message: 'Supabase 설정이 올바릅니다.',
    details: {
      url: supabaseUrl,
      keyLength,
    },
  }
}

