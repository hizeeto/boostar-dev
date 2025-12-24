import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/lib/toast"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: "소유자" | "관리자" | "멤버"
  permission: "전체 권한" | "편집 권한" | "조회 권한"
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
  } | null
}

export function useProjectMembers(projectId: string | null) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadMembers = useCallback(async () => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      let userId: string
      
      if (demoUser) {
        userId = DEMO_USER_ID
        console.log('[useProjectMembers] 데모 사용자 모드:', userId)
      } else {
        // 사용자 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          throw new Error("로그인이 필요합니다")
        }
        
        userId = user.id
      }
      
      // 멤버 조회
      const { data: membersData, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error("멤버 조회 오류:", error)
        throw error
      }
      
      console.log("프로젝트 멤버 조회 결과:", { projectId, count: membersData?.length || 0, membersData })
      
      // 각 멤버의 프로필 정보 조회 (프로필이 없어도 멤버는 표시)
      const membersWithProfiles = await Promise.all(
        (membersData || []).map(async (member: any) => {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, email, full_name, nickname, avatar_url')
              .eq('id', member.user_id)
              .maybeSingle()
            
            return {
              ...member,
              profile: profileError || !profileData ? null : profileData,
            }
          } catch (profileErr) {
            // 프로필 조회 실패해도 멤버는 표시
            console.warn(`프로필 조회 실패 (user_id: ${member.user_id}):`, profileErr)
            return {
              ...member,
              profile: null,
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
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      loadMembers()
    } else {
      setMembers([])
      setLoading(false)
    }
  }, [projectId, loadMembers])

  const addMember = async (userId: string, role: "소유자" | "관리자" | "멤버" = "멤버", permission: "전체 권한" | "편집 권한" | "조회 권한" = "조회 권한") => {
    if (!projectId) {
      throw new Error("프로젝트를 선택해주세요")
    }

    try {
      // API route를 통해 프로젝트 멤버 추가 (RLS 정책 우회)
      const response = await fetch('/api/project-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          userId,
          role,
          permission,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "멤버 추가에 실패했습니다")
      }

      const result = await response.json()
      
      // 멤버 목록 즉시 새로고침
      await loadMembers()
      
      return result.data
    } catch (err: any) {
      console.error("멤버 추가 실패:", err)
      if (err.message?.includes("이미 추가된 멤버")) {
        throw new Error("이미 추가된 멤버입니다")
      }
      throw err
    }
  }

  const updateMember = async (memberId: string, updates: { role?: "소유자" | "관리자" | "멤버", permission?: "전체 권한" | "편집 권한" | "조회 권한" }) => {
    if (!projectId) {
      throw new Error("프로젝트를 선택해주세요")
    }

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('project_members')
        .update(updates)
        .eq('id', memberId)
        .eq('project_id', projectId)

      if (error) throw error
      
      await loadMembers()
      toast.success("멤버 정보가 업데이트되었습니다")
    } catch (err) {
      console.error("멤버 업데이트 실패:", err)
      throw err
    }
  }

  const deleteMember = async (memberId: string) => {
    if (!projectId) {
      throw new Error("프로젝트를 선택해주세요")
    }

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId)
        .eq('project_id', projectId)

      if (error) throw error
      
      // 프로젝트의 member_count 업데이트
      const { data: projectData } = await supabase
        .from('projects')
        .select('member_count')
        .eq('id', projectId)
        .single()
      
      if (projectData && projectData.member_count > 0) {
        await supabase
          .from('projects')
          .update({ member_count: Math.max(0, projectData.member_count - 1) })
          .eq('id', projectId)
      }
      
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
    deleteMember,
  }
}

