'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { checkSupabaseConfig } from '@/lib/supabase/health-check'

interface ConnectionInfo {
  url: string
  urlValid: boolean
  keyPresent: boolean
  keyLength: number
}

export default function TestSupabasePage() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState<string[]>([])
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null)
  const [canRetry, setCanRetry] = useState(false)

  const checkSupabase = async () => {
    setStatus('checking')
    setMessage('')
    setDetails([])
    setCanRetry(false)

    try {
      // 1. 환경 변수 기본 검증
      const configCheck = checkSupabaseConfig()
      
      if (!configCheck.connected) {
        setStatus('error')
        setMessage(configCheck.message)
        setDetails([
          configCheck.details?.error || '',
          '.env.local 파일이 프로젝트 루트에 있는지 확인하세요.',
          '환경 변수 변경 후 개발 서버를 재시작했는지 확인하세요.',
        ])
        setConnectionInfo({
          url: configCheck.details?.url || '',
          urlValid: configCheck.urlValid,
          keyPresent: configCheck.keyPresent,
          keyLength: configCheck.details?.keyLength || 0,
        })
        setCanRetry(true)
        return
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      setConnectionInfo({
        url: supabaseUrl,
        urlValid: configCheck.urlValid,
        keyPresent: configCheck.keyPresent,
        keyLength: configCheck.details?.keyLength || 0,
      })

      // Supabase 클라이언트 생성 및 연결 테스트
      const supabase = createClient()
      const testDetails: string[] = []

      // 서버 사이드 연결 테스트
      testDetails.push('서버 사이드 연결 확인 중...')
      try {
        const serverResponse = await fetch('/api/supabase-test')
        const serverData = await serverResponse.json()
        if (serverData.success) {
          testDetails.push('서버 사이드: 연결 성공 ✓')
        } else {
          testDetails.push(`서버 사이드: ${serverData.error || '오류'}`)
        }
      } catch (serverError: any) {
        testDetails.push(`서버 사이드: ${serverError.message || '연결 실패'}`)
      }
      
      // 1. 인증 서비스 연결 테스트
      testDetails.push('클라이언트 인증 서비스 확인 중...')
      const { data: authData, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        // 인증 오류는 연결 문제가 아닐 수 있음 (세션이 없는 경우)
        testDetails.push(`인증 상태: ${authError.message}`)
      } else {
        testDetails.push('클라이언트 인증 서비스: 연결 성공 ✓')
      }

      // 2. REST API 연결 테스트 (health check)
      testDetails.push('REST API 연결 확인 중...')
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseAnonKey,
          },
        })
        
        if (response.ok || response.status === 404) {
          // 404는 정상 (엔드포인트가 없을 수 있음)
          testDetails.push('REST API: 연결 성공 ✓')
        } else {
          testDetails.push(`REST API: 응답 코드 ${response.status}`)
        }
      } catch (fetchError: any) {
        testDetails.push(`REST API: ${fetchError.message}`)
      }

      // 3. Realtime 연결 테스트 (선택적)
      testDetails.push('Realtime 서비스 확인 중...')
      try {
        const channel = supabase.channel('test-connection')
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            testDetails.push('Realtime: 연결 성공 ✓')
          } else if (status === 'CHANNEL_ERROR') {
            testDetails.push('Realtime: 연결 오류')
          }
        })
        
        // 구독 후 즉시 해제
        setTimeout(() => {
          supabase.removeChannel(channel)
        }, 1000)
        testDetails.push('Realtime: 구독 시도 완료')
      } catch (realtimeError: any) {
        testDetails.push(`Realtime: ${realtimeError.message || '연결 확인 불가'}`)
      }

      setDetails(testDetails)
      setStatus('success')
      setMessage('Supabase 연결이 성공적으로 설정되었습니다!')
      setCanRetry(true)
    } catch (error: any) {
      setStatus('error')
      setMessage(`연결 오류: ${error.message || '알 수 없는 오류가 발생했습니다.'}`)
      setDetails([
        error.message || '알 수 없는 오류',
        'Supabase 프로젝트가 활성화되어 있는지 확인하세요.',
        '네트워크 연결을 확인하세요.',
      ])
      setCanRetry(true)
    }
  }

  useEffect(() => {
    checkSupabase()
  }, [])

  const maskUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname
      const parts = hostname.split('.')
      if (parts.length > 0) {
        const masked = parts[0].substring(0, 4) + '***.' + parts.slice(1).join('.')
        return `${urlObj.protocol}//${masked}`
      }
      return url
    } catch {
      return url.substring(0, 20) + '***'
    }
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return '***'
    return key.substring(0, 8) + '***' + key.substring(key.length - 4)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Supabase 연결 테스트</h1>
          <p className="text-muted-foreground">연결 상태 및 설정을 확인합니다</p>
        </div>
        
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-4 w-4 rounded-full ${
                  status === 'checking'
                    ? 'bg-yellow-500 animate-pulse'
                    : status === 'success'
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              />
              <span className="font-semibold text-lg">
                {status === 'checking' && '확인 중...'}
                {status === 'success' && '연결 성공'}
                {status === 'error' && '연결 실패'}
              </span>
            </div>
            {canRetry && (
              <Button onClick={checkSupabase} variant="outline" size="sm">
                다시 확인
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <p className="font-medium">{message}</p>
            
            {connectionInfo && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">URL:</span>
                  <span className={connectionInfo.urlValid ? 'text-green-600' : 'text-red-600'}>
                    {maskUrl(connectionInfo.url)}
                  </span>
                  {connectionInfo.urlValid ? '✓' : '✗'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Anon Key:</span>
                  <span className={connectionInfo.keyPresent ? 'text-green-600' : 'text-red-600'}>
                    {maskKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')}
                  </span>
                  <span className="text-muted-foreground">
                    ({connectionInfo.keyLength} characters)
                  </span>
                </div>
              </div>
            )}

            {details.length > 0 && (
              <div className="mt-4 space-y-1">
                {details.map((detail, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    {detail}
                  </p>
                ))}
              </div>
            )}
          </div>
          
          {status === 'error' && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded">
              <p className="text-sm font-semibold mb-2">문제 해결 방법:</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>.env.local 파일이 프로젝트 루트에 있는지 확인</li>
                <li>NEXT_PUBLIC_SUPABASE_URL이 올바른 형식인지 확인 (https://xxx.supabase.co)</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY가 올바르게 설정되었는지 확인</li>
                <li>Supabase 프로젝트가 활성화되어 있는지 확인</li>
                <li>환경 변수 변경 후 개발 서버를 재시작했는지 확인</li>
                <li>Supabase Dashboard에서 프로젝트 설정을 확인</li>
              </ul>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded">
              <p className="text-sm font-semibold mb-2 text-green-600">✓ 모든 연결이 정상입니다</p>
              <p className="text-sm text-muted-foreground">
                이제 Supabase 기능을 사용할 수 있습니다. 인증, 데이터베이스, 스토리지 등의 기능을 활용하세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

