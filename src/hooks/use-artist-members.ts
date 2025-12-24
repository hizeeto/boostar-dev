import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/lib/toast"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"

export interface ArtistMember {
  id: string
  artist_id: string
  user_id: string
  role: "소유자" | "관리자" | "멤버"
  permission: "전체 권한" | "편집 권한" | "조회 권한"
  artist_role_id: string | null
  created_at: string
  updated_at: string
  last_access_at: string | null
  // 조인된 프로필 정보
  profile?: {
    id: string
    email: string | null
    full_name: string | null
    nickname: string | null
    avatar_url: string | null
  }
  // 조인된 역할 정보 (여러 개 가능)
  artist_roles?: Array<{
    id: string
    category: string
    role_name: string
  }> | null
}

export function useArtistMembers(artistId: string | null) {
  const [members, setMembers] = useState<ArtistMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadMembers = useCallback(async () => {
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
        console.log('[useArtistMembers] 데모 사용자 모드:', userId)
      } else {
        // 사용자 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          throw new Error("로그인이 필요합니다")
        }
        
        userId = user.id
      }
      
      // 멤버 조회 (역할 정보 포함 - 여러 개)
      const { data: membersData, error } = await supabase
        .from('artist_members')
        .select(`
          *,
          artist_member_roles(
            role:artist_roles(id, category, role_name)
          )
        `)
        .eq('artist_id', artistId)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error("멤버 조회 오류:", error)
        throw error
      }
      
      console.log("멤버 조회 결과:", { artistId, count: membersData?.length || 0, membersData })
      
      // 각 멤버의 프로필 정보 조회 (프로필이 없어도 멤버는 표시)
      const membersWithProfiles = await Promise.all(
        (membersData || []).map(async (member: any) => {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, email, full_name, nickname, avatar_url')
              .eq('id', member.user_id)
              .maybeSingle()
            
            // 멤버 역할 정보 변환
            const roles = member.artist_member_roles
              ?.map((mr: any) => mr.role)
              .filter((r: any) => r !== null) || []
            
            return {
              ...member,
              profile: profileError || !profileData ? null : profileData,
              artist_roles: roles.length > 0 ? roles : null,
            }
          } catch (profileErr) {
            // 프로필 조회 실패해도 멤버는 표시
            console.warn(`프로필 조회 실패 (user_id: ${member.user_id}):`, profileErr)
            const roles = member.artist_member_roles
              ?.map((mr: any) => mr.role)
              .filter((r: any) => r !== null) || []
            return {
              ...member,
              profile: null,
              artist_roles: roles.length > 0 ? roles : null,
            }
          }
        })
      )
      
      setMembers(membersWithProfiles)
    } catch (err) {
      console.error("멤버 로드 실패:", err)
      setError(err instanceof Error ? err : new Error("멤버를 불러올 수 없습니다"))
      // 멤버가 없는 경우는 오류로 표시하지 않음
      if (err instanceof Error && !err.message.includes("로그인이 필요합니다")) {
        // 조용히 처리 (멤버가 없는 경우는 정상)
        setMembers([])
      } else {
        toast.error("멤버를 불러올 수 없습니다")
      }
    } finally {
      setLoading(false)
    }
  }, [artistId])

  useEffect(() => {
    if (artistId) {
      loadMembers()
    } else {
      setMembers([])
      setLoading(false)
    }
  }, [artistId, loadMembers])

  const addMember = async (userId: string, role: "소유자" | "관리자" | "멤버" = "멤버", permission: "전체 권한" | "편집 권한" | "조회 권한" = "조회 권한") => {
    if (!artistId) {
      throw new Error("아티스트를 선택해주세요")
    }

    try {
      const supabase = createClient()
      
      // 데모 사용자 확인 (현재 로그인한 사용자 ID 확인용, 추가할 userId는 별개)
      const demoUser = getDemoUser()
      if (!demoUser) {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          throw new Error("로그인이 필요합니다")
        }
      }

      const { data, error } = await supabase
        .from('artist_members')
        .insert({
          artist_id: artistId,
          user_id: userId,
          role,
          permission,
        })
        .select()
        .single()

      if (error) throw error
      
      await loadMembers()
      toast.success("멤버가 초대되었습니다")
      return data
    } catch (err: any) {
      console.error("멤버 추가 실패:", err)
      if (err.code === '23505') {
        throw new Error("이미 초대된 멤버입니다")
      }
      throw err
    }
  }

  const updateMember = async (memberId: string, updates: { role?: "소유자" | "관리자" | "멤버", permission?: "전체 권한" | "편집 권한" | "조회 권한" }) => {
    if (!artistId) {
      throw new Error("아티스트를 선택해주세요")
    }

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('artist_members')
        .update(updates)
        .eq('id', memberId)
        .eq('artist_id', artistId)

      if (error) throw error
      
      await loadMembers()
      toast.success("멤버 정보가 업데이트되었습니다")
    } catch (err) {
      console.error("멤버 업데이트 실패:", err)
      throw err
    }
  }

  // 멤버 역할 업데이트 (여러 개)
  const updateMemberRoles = async (memberId: string, roleIds: string[]) => {
    if (!artistId) {
      throw new Error("아티스트를 선택해주세요")
    }

    try {
      const supabase = createClient()
      
      // 기존 역할 모두 삭제
      const { error: deleteError } = await supabase
        .from('artist_member_roles')
        .delete()
        .eq('member_id', memberId)

      if (deleteError) throw deleteError

      // 새 역할 추가
      if (roleIds.length > 0) {
        const { error: insertError } = await supabase
          .from('artist_member_roles')
          .insert(roleIds.map(roleId => ({ member_id: memberId, role_id: roleId })))

        if (insertError) throw insertError
      }
      
      await loadMembers()
      toast.success("멤버 역할이 업데이트되었습니다")
    } catch (err) {
      console.error("멤버 역할 업데이트 실패:", err)
      throw err
    }
  }

  const deleteMember = async (memberId: string) => {
    if (!artistId) {
      throw new Error("아티스트를 선택해주세요")
    }

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('artist_members')
        .delete()
        .eq('id', memberId)
        .eq('artist_id', artistId)

      if (error) throw error
      
      await loadMembers()
      toast.success("멤버가 제거되었습니다")
    } catch (err) {
      console.error("멤버 삭제 실패:", err)
      throw err
    }
  }

  return { 
    members, 
    loading, 
    error, 
    refetch: loadMembers,
    addMember,
    updateMember,
    updateMemberRoles,
    deleteMember,
  }
}

