import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { generateProjectCode } from "@/lib/utils"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"

export interface Artist {
  id: string
  user_id: string
  names: Record<string, string> | null // 다국어 이름 (JSON 형식: {"ko": "한국어", "en": "English", ...})
  description: string | null
  icon_url: string | null
  cover_image_url: string | null // 커버 이미지 URL (16:3 비율)
  color: string | null
  artist_code: string | null
  sns: Record<string, string> | null // SNS 정보 (JSON)
  agency: string | null // 기획사
  debut_date: string | null // 데뷔일 또는 결성일
  main_genre: string | null // 대표 장르
  sub_genre: string | null // 세부 장르
  custom_genre: string | null // 직접 입력 장르
  artist_type: string | null // 아티스트 유형
  custom_artist_type: string | null // 직접 입력 아티스트 유형
  tags: string[] | null // 태그 목록
  permission_settings: Record<string, Record<string, boolean>> | null // 권한 설정
  is_default: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export function useArtists() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadArtists()
  }, [])

  const loadArtists = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      let userId: string
      
      if (demoUser) {
        // 데모 사용자인 경우 고정된 ID 사용
        userId = DEMO_USER_ID
        console.log('[useArtists] 데모 사용자 모드:', userId)
      } else {
        // 일반 사용자인 경우 Supabase 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          const loginError = new Error("세션이 만료되었거나 로그인이 필요합니다. 다시 로그인해주세요.")
          console.error('[useArtists] 인증 오류:', authError || '사용자 없음')
          throw loginError
        }
        
        userId = user.id
        console.log('[useArtists] 일반 사용자 모드:', userId)
      }
      
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('[useArtists] DB 쿼리 오류:', error)
        throw new Error(`아티스트 데이터를 불러오는 중 오류가 발생했습니다: ${error.message}`)
      }
      
      console.log(`[useArtists] ${data?.length || 0}개의 아티스트 로드 완료`)
      setArtists(data || [])
    } catch (err) {
      console.error("[useArtists] 아티스트 로드 실패:", err)
      const errorMessage = err instanceof Error ? err.message : "아티스트를 불러올 수 없습니다"
      setError(err instanceof Error ? err : new Error(errorMessage))
      
      // 로그인이 필요한 경우 사용자를 로그인 페이지로 안내
      if (errorMessage.includes("로그인") || errorMessage.includes("세션")) {
        console.log('[useArtists] 로그인 필요 - 3초 후 로그인 페이지로 이동합니다.')
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
          }
        }, 3000)
      }
    } finally {
      setLoading(false)
    }
  }

  const createArtist = async (artistData: {
    name: string
    description?: string
    icon_url?: string
    color?: string
  }) => {
    try {
      const supabase = createClient()
      
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      let userId: string
      
      if (demoUser) {
        userId = DEMO_USER_ID
      } else {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          throw new Error("로그인이 필요합니다")
        }
        
        userId = user.id
      }

      // 기본 아티스트가 없으면 첫 번째 아티스트를 기본으로 설정
      const existingArtists = artists.filter(a => a.user_id === userId)
      const hasDefault = existingArtists.some(a => a.is_default)
      
      // 고유번호 생성 및 중복 확인
      let artistCode: string
      let attempts = 0
      const maxAttempts = 10
      
      do {
        artistCode = generateProjectCode()
        const { data: existing } = await supabase
          .from('artists')
          .select('id')
          .eq('artist_code', artistCode)
          .maybeSingle()
        
        if (!existing) {
          break // 고유번호가 중복되지 않음
        }
        
        attempts++
        if (attempts >= maxAttempts) {
          throw new Error("고유번호 생성에 실패했습니다. 다시 시도해주세요.")
        }
      } while (true)
      
      // names JSONB에 저장
      const insertData: any = {
        user_id: userId,
        names: { ko: artistData.name },
        description: artistData.description || null,
        icon_url: artistData.icon_url || null,
        color: artistData.color || null,
        artist_code: artistCode,
        is_default: !hasDefault,
        sort_order: existingArtists.length,
      }
      
      const { data, error } = await supabase
        .from('artists')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      
      await loadArtists()
      return data
    } catch (err) {
      console.error("아티스트 생성 실패:", err)
      throw err
    }
  }

  const updateArtist = async (artistId: string, updates: Partial<Artist>) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('artists')
        .update(updates)
        .eq('id', artistId)

      if (error) throw error
      
      await loadArtists()
    } catch (err) {
      console.error("아티스트 업데이트 실패:", err)
      throw err
    }
  }

  const deleteArtist = async (artistId: string) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', artistId)

      if (error) throw error
      
      await loadArtists()
    } catch (err) {
      console.error("아티스트 삭제 실패:", err)
      throw err
    }
  }

  const getDefaultArtist = () => {
    return artists.find(a => a.is_default) || artists[0] || null
  }

  return { 
    artists, 
    loading, 
    error, 
    refetch: loadArtists,
    createArtist,
    updateArtist,
    deleteArtist,
    getDefaultArtist,
  }
}

