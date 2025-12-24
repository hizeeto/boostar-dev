import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/lib/toast"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"

export interface ArtistRole {
  id: string
  artist_id: string
  category: string
  role_name: string
  is_enabled: boolean
  display_order: number
  created_at: string
  updated_at: string
}

// 기본 역할 목록 정의
export const DEFAULT_ROLES: Record<string, string[]> = {
  "팀 운영": ["리더", "공동 리더", "부리더", "밴드마스터", "음악감독", "라이브 디렉터"],
  "참여 형태": ["솔로", "듀오 멤버", "그룹 멤버", "정규 멤버", "객원 멤버", "피처링 아티스트", "게스트 아티스트", "오프닝 아티스트", "스페셜 게스트"],
  "보컬·랩": ["보컬", "리드 보컬", "메인 보컬", "서브 보컬", "코러스", "백업 보컬", "하모니 보컬", "래퍼", "메인 래퍼", "서브 래퍼", "MC"],
  "기타": ["기타리스트", "일렉 기타", "어쿠스틱 기타", "리드 기타", "리듬 기타", "세컨드 기타"],
  "베이스": ["베이시스트", "베이스"],
  "드럼·퍼커션": ["드러머", "드럼", "퍼커셔니스트", "퍼커션"],
  "키보드·피아노": ["키보디스트", "키보드", "피아니스트", "피아노", "신시사이저", "신스", "오르가니스트", "오르간"],
  "DJ·전자": ["DJ", "턴테이블리스트", "턴테이블", "샘플러", "프로그래머", "시퀀서", "미디 프로그래머", "트랙 메이커"],
  "제작·송라이팅": ["프로듀서", "총괄 프로듀서", "공동 프로듀서", "작곡가", "공동 작곡가", "작사가", "공동 작사가", "편곡가", "공동 편곡가", "탑라이너", "멜로디 메이커"],
  "스트링": ["스트링 연주자", "바이올리니스트", "바이올린", "비올리스트", "비올라", "첼리스트", "첼로", "콘트라베이시스트", "콘트라베이스"],
  "브라스·윈드": ["관악 연주자", "브라스 연주자", "윈드 연주자", "트럼페터", "트럼펫", "트롬보니스트", "트롬본", "색소포니스트", "색소폰", "플루티스트", "플루트", "클라리네티스트", "클라리넷"],
  "세션": ["세션 보컬", "세션 코러스", "세션 기타", "세션 베이스", "세션 드럼", "세션 퍼커션", "세션 키보드", "세션 스트링", "세션 브라스"],
}

export function useArtistRoles(artistId: string | null) {
  const [roles, setRoles] = useState<ArtistRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadRoles = useCallback(async () => {
    if (!artistId) return

    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      let userId: string
      
      if (demoUser) {
        userId = DEMO_USER_ID
        console.log('[useArtistRoles] 데모 사용자 모드:', userId)
      } else {
        // 사용자 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          throw new Error("로그인이 필요합니다")
        }
        
        userId = user.id
      }
      
      // 역할 조회
      const { data: rolesData, error } = await supabase
        .from('artist_roles')
        .select('*')
        .eq('artist_id', artistId)
        .order('category', { ascending: true })
        .order('display_order', { ascending: true })
        .order('role_name', { ascending: true })
      
      if (error) {
        console.error("역할 조회 오류:", error)
        throw error
      }
      
      setRoles(rolesData || [])
    } catch (err) {
      console.error("역할 로드 실패:", err)
      setError(err instanceof Error ? err : new Error("역할을 불러올 수 없습니다"))
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [artistId])

  useEffect(() => {
    if (artistId) {
      loadRoles()
    } else {
      setRoles([])
      setLoading(false)
    }
  }, [artistId, loadRoles])

  // 초기 역할 목록 생성 (아직 역할이 없는 경우)
  const initializeRoles = useCallback(async () => {
    if (!artistId) {
      throw new Error("아티스트를 선택해주세요")
    }

    try {
      const supabase = createClient()
      
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      if (!demoUser) {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          throw new Error("로그인이 필요합니다")
        }
      }

      // 기존 역할이 있는지 확인
      const { data: existingRoles } = await supabase
        .from('artist_roles')
        .select('id')
        .eq('artist_id', artistId)
        .limit(1)

      if (existingRoles && existingRoles.length > 0) {
        // 이미 역할이 있으면 로드만
        await loadRoles()
        return
      }

      // 기본 역할 목록 생성
      const rolesToInsert: Omit<ArtistRole, 'id' | 'created_at' | 'updated_at'>[] = []
      let displayOrder = 0

      Object.entries(DEFAULT_ROLES).forEach(([category, roleNames]) => {
        roleNames.forEach((roleName) => {
          rolesToInsert.push({
            artist_id: artistId,
            category,
            role_name: roleName,
            is_enabled: true,
            display_order: displayOrder++,
          })
        })
      })

      if (rolesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('artist_roles')
          .insert(rolesToInsert)

        if (insertError) throw insertError
      }

      await loadRoles()
      toast.success("역할 목록이 초기화되었습니다")
    } catch (err: any) {
      console.error("역할 초기화 실패:", err)
      throw err
    }
  }, [artistId, loadRoles])

  // 역할 활성화/비활성화 토글
  const toggleRole = async (roleId: string, isEnabled: boolean) => {
    if (!artistId) {
      throw new Error("아티스트를 선택해주세요")
    }

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('artist_roles')
        .update({ is_enabled: isEnabled })
        .eq('id', roleId)
        .eq('artist_id', artistId)

      if (error) throw error
      
      await loadRoles()
    } catch (err) {
      console.error("역할 업데이트 실패:", err)
      throw err
    }
  }

  // 여러 역할 일괄 업데이트
  const updateRoles = async (updates: { id: string; is_enabled: boolean }[]) => {
    if (!artistId) {
      throw new Error("아티스트를 선택해주세요")
    }

    try {
      const supabase = createClient()
      
      // 각 역할을 개별적으로 업데이트
      await Promise.all(
        updates.map((update) =>
          supabase
            .from('artist_roles')
            .update({ is_enabled: update.is_enabled })
            .eq('id', update.id)
            .eq('artist_id', artistId)
        )
      )

      await loadRoles()
      toast.success("역할이 업데이트되었습니다")
    } catch (err) {
      console.error("역할 일괄 업데이트 실패:", err)
      throw err
    }
  }

  // 역할 추가 (직접 입력)
  const addRole = useCallback(async (roleName: string) => {
    if (!artistId) {
      throw new Error("아티스트를 선택해주세요")
    }

    if (!roleName.trim()) {
      throw new Error("역할 이름을 입력해주세요")
    }

    try {
      const supabase = createClient()
      
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      if (!demoUser) {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          throw new Error("로그인이 필요합니다")
        }
      }

      // 같은 아티스트에 같은 이름의 역할이 이미 있는지 확인
      const { data: existingRole } = await supabase
        .from('artist_roles')
        .select('id')
        .eq('artist_id', artistId)
        .eq('category', '직접 입력')
        .eq('role_name', roleName.trim())
        .limit(1)

      if (existingRole && existingRole.length > 0) {
        throw new Error("이미 존재하는 역할입니다")
      }

      // display_order 계산 (직접 입력 카테고리의 최대값 + 1)
      const { data: maxOrderData } = await supabase
        .from('artist_roles')
        .select('display_order')
        .eq('artist_id', artistId)
        .eq('category', '직접 입력')
        .order('display_order', { ascending: false })
        .limit(1)

      const maxOrder = maxOrderData && maxOrderData.length > 0 
        ? maxOrderData[0].display_order 
        : -1

      // 역할 추가
      const { error: insertError } = await supabase
        .from('artist_roles')
        .insert({
          artist_id: artistId,
          category: '직접 입력',
          role_name: roleName.trim(),
          is_enabled: true,
          display_order: maxOrder + 1,
        })

      if (insertError) throw insertError

      await loadRoles()
      toast.success("역할이 추가되었습니다")
    } catch (err: any) {
      console.error("역할 추가 실패:", err)
      throw err
    }
  }, [artistId, loadRoles])

  // 역할 삭제 (직접 입력한 역할만)
  const deleteRole = useCallback(async (roleId: string) => {
    if (!artistId) {
      throw new Error("아티스트를 선택해주세요")
    }

    try {
      const supabase = createClient()
      
      // 역할이 '직접 입력' 카테고리인지 확인
      const { data: roleData, error: fetchError } = await supabase
        .from('artist_roles')
        .select('category')
        .eq('id', roleId)
        .eq('artist_id', artistId)
        .single()

      if (fetchError || !roleData) {
        throw new Error("역할을 찾을 수 없습니다")
      }

      if (roleData.category !== '직접 입력') {
        throw new Error("직접 입력한 역할만 삭제할 수 있습니다")
      }

      // 역할 삭제
      const { error: deleteError } = await supabase
        .from('artist_roles')
        .delete()
        .eq('id', roleId)
        .eq('artist_id', artistId)

      if (deleteError) throw deleteError

      await loadRoles()
      toast.success("역할이 삭제되었습니다")
    } catch (err: any) {
      console.error("역할 삭제 실패:", err)
      throw err
    }
  }, [artistId, loadRoles])

  return { 
    roles, 
    loading, 
    error, 
    refetch: loadRoles,
    initializeRoles,
    toggleRole,
    updateRoles,
    addRole,
    deleteRole,
  }
}

