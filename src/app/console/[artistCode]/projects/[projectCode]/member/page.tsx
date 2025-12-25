"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useArtistContext } from "@/hooks/use-artist-context"
import { useProjectMembers } from "@/hooks/use-project-members"
import { useArtistMembers } from "@/hooks/use-artist-members"
import { createClient } from "@/lib/supabase/client"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Plus, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "@/lib/toast"
import { AddProjectMemberDialog } from "@/components/add-project-member-dialog"
import { ChangePermissionDialog } from "@/components/change-permission-dialog"
import { ProjectNavTabs } from "@/components/project-nav-tabs"

// UUID 형식 검증 함수
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// 권한: 소유자, 관리자, 멤버
const PERMISSIONS: Array<"소유자" | "관리자" | "멤버"> = ["소유자", "관리자", "멤버"]

// 권한 매핑 함수: DB의 permission 값을 UI의 권한으로 변환
const mapPermissionToRole = (permission: "전체 권한" | "편집 권한" | "조회 권한"): "소유자" | "관리자" | "멤버" => {
  switch (permission) {
    case "전체 권한":
      return "소유자"
    case "편집 권한":
      return "관리자"
    case "조회 권한":
      return "멤버"
    default:
      return "멤버"
  }
}

// 권한을 DB의 permission 값으로 변환
const mapRoleToPermission = (role: "소유자" | "관리자" | "멤버"): "전체 권한" | "편집 권한" | "조회 권한" => {
  switch (role) {
    case "소유자":
      return "전체 권한"
    case "관리자":
      return "편집 권한"
    case "멤버":
      return "조회 권한"
  }
}

export default function ProjectMemberPage() {
  const params = useParams()
  const router = useRouter()
  const artistContext = useArtistContext()
  const activeArtist = artistContext?.activeArtist
  const artistCode = params.artistCode as string
  const projectCode = params.projectCode as string
  
  const [project, setProject] = useState<{ id: string; owner_id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [changePermissionDialog, setChangePermissionDialog] = useState<{ open: boolean; memberId: string | null; memberName: string; currentPermission: "소유자" | "관리자" | "멤버" | null }>({
    open: false,
    memberId: null,
    memberName: "",
    currentPermission: null,
  })
  
  // 현재 로그인한 사용자 ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  useEffect(() => {
    const getCurrentUser = async () => {
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      
      if (demoUser) {
        console.log('[ProjectMemberPage] 데모 사용자 모드:', DEMO_USER_ID)
        setCurrentUserId(DEMO_USER_ID)
        return
      }
      
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [])
  
  // 프로젝트 정보 로드
  const loadProject = useCallback(async () => {
    if (!activeArtist) {
      console.error("[프로젝트 멤버] 활성 아티스트가 없습니다")
      if (artistContext && !artistContext.loading) {
        router.push(`/console/${artistCode}/projects`)
      }
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      console.log("[프로젝트 멤버] 프로젝트 로드 시도:", { 
        projectCode, 
        artistId: activeArtist.id,
        artistCode: activeArtist.artist_code,
        isUUID: isValidUUID(projectCode)
      })

      // UUID 형식인지 확인하여 조건부로 쿼리 구성
      let query = supabase
        .from('projects')
        .select('id, owner_id')
        .eq('artist_id', activeArtist.id)

      if (isValidUUID(projectCode)) {
        // UUID 형식이면 project_code 또는 id로 조회
        query = query.or(`project_code.eq.${projectCode},id.eq.${projectCode}`)
      } else {
        // UUID 형식이 아니면 project_code로만 조회
        query = query.eq('project_code', projectCode)
      }

      const { data, error } = await query.maybeSingle()

      console.log("[프로젝트 멤버] 조회 결과:", { 
        found: !!data, 
        error: error?.message,
        errorCode: error?.code,
        projectCode: data?.id
      })

      if (error) {
        console.error("[프로젝트 멤버] 프로젝트 조회 오류:", error)
        toast.error("프로젝트를 불러올 수 없습니다")
        setLoading(false)
        router.push(`/console/${artistCode}/projects`)
        return
      }

      if (!data) {
        console.error("[프로젝트 멤버] 프로젝트를 찾을 수 없음")
        toast.error("프로젝트를 찾을 수 없습니다")
        setLoading(false)
        router.push(`/console/${artistCode}/projects`)
        return
      }

      setProject(data)
    } catch (err) {
      console.error("[프로젝트 멤버] 프로젝트 로드 실패:", err)
      toast.error("프로젝트를 불러올 수 없습니다")
      setLoading(false)
      router.push(`/console/${artistCode}/projects`)
    } finally {
      setLoading(false)
    }
  }, [activeArtist, projectCode, artistCode, router, artistContext])

  useEffect(() => {
    if (activeArtist) {
      loadProject()
    } else if (artistContext && !artistContext.loading) {
      // 아티스트가 로드되었지만 activeArtist가 없는 경우
      console.error("활성 아티스트가 없습니다")
      router.push(`/console/${artistCode}/projects`)
    }
  }, [projectCode, activeArtist?.id, artistContext?.loading, loadProject, artistCode, router])
  
  // 현재 사용자가 프로젝트 소유자인지 확인
  const isCurrentUserOwner = currentUserId === project?.owner_id
  
  // 프로젝트 멤버 데이터 로드
  const { members, loading: membersLoading, updateMember, deleteMember, refetch } = useProjectMembers(project?.id || null)
  
  // 아티스트 멤버 데이터 로드 (멤버 추가 다이얼로그에서 사용)
  const { members: artistMembers } = useArtistMembers(activeArtist?.id || null)
  
  // 프로젝트 소유자를 멤버로 자동 추가
  const [isAddingOwner, setIsAddingOwner] = useState(false)
  
  useEffect(() => {
    const addOwnerAsMember = async () => {
      if (!project || membersLoading || !project.owner_id || isAddingOwner) return
      
      // 소유자가 멤버 목록에 없으면 자동으로 추가
      const ownerExists = members.some(m => m.user_id === project.owner_id)
      if (!ownerExists) {
        setIsAddingOwner(true)
        try {
          const supabase = createClient()
          await supabase
            .from('project_members')
            .insert({
              project_id: project.id,
              user_id: project.owner_id,
              role: "소유자",
              permission: "전체 권한",
            })
          // 멤버 목록 다시 로드
          await refetch()
        } catch (err: any) {
          // 이미 추가되었거나 오류가 발생한 경우 멤버 목록 다시 로드 시도
          if (err.message?.includes("이미 추가된 멤버") || err.code === '23505') {
            await refetch()
          } else {
            console.error("소유자 멤버 추가 실패:", err)
          }
        } finally {
          setIsAddingOwner(false)
        }
      }
    }
    
    if (project && !membersLoading) {
      addOwnerAsMember()
    }
  }, [project?.id, project?.owner_id, members, membersLoading, refetch, isAddingOwner])
  
  // 정렬 상태
  type SortColumn = "이름" | "이메일" | "권한" | "마지막 접속일" | null
  type SortDirection = "asc" | "desc" | null
  const [sortColumn, setSortColumn] = useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  
  // 멤버 정보 가져오기 (프로필 정보 포함)
  const getMemberDisplayName = (member: typeof members[0]) => {
    return member.profile?.full_name || member.profile?.nickname || "이름 없음"
  }

  const getMemberEmail = (member: typeof members[0]) => {
    return member.profile?.email || "이메일 없음"
  }
  
  // 정렬 핸들러
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // 같은 컬럼 클릭 시 방향 토글
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortColumn(null)
        setSortDirection(null)
      } else {
        setSortDirection("asc")
      }
    } else {
      // 다른 컬럼 클릭 시 오름차순으로 설정
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // 정렬된 멤버 목록
  const sortedMembers = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return members
    }

    const sorted = [...members].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortColumn) {
        case "이름":
          aValue = getMemberDisplayName(a).toLowerCase()
          bValue = getMemberDisplayName(b).toLowerCase()
          break
        case "이메일":
          aValue = getMemberEmail(a).toLowerCase()
          bValue = getMemberEmail(b).toLowerCase()
          break
        case "권한":
          // 권한 우선순위: 소유자 > 관리자 > 멤버
          const permissionOrder = { "소유자": 1, "관리자": 2, "멤버": 3 }
          const aRole = mapPermissionToRole(a.permission)
          const bRole = mapPermissionToRole(b.permission)
          aValue = permissionOrder[aRole] || 999
          bValue = permissionOrder[bRole] || 999
          break
        case "마지막 접속일":
          // 날짜 비교 (null은 가장 뒤로)
          if (!a.last_access_at && !b.last_access_at) return 0
          if (!a.last_access_at) return 1
          if (!b.last_access_at) return -1
          aValue = new Date(a.last_access_at).getTime()
          bValue = new Date(b.last_access_at).getTime()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return sorted
  }, [members, sortColumn, sortDirection])
  
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)
  
  // 멤버 삭제
  const handleDeleteMember = async (memberId: string) => {
    const member = sortedMembers.find(m => m.id === memberId)
    const memberRole = member ? mapPermissionToRole(member.permission) : null
    
    // 프로젝트 소유자 본인은 삭제할 수 없음
    if (member && memberRole === "소유자" && member.user_id === project?.owner_id && member.user_id === currentUserId) {
      toast.error("프로젝트 소유자 본인은 제거할 수 없습니다")
      return
    }
    
    if (!confirm("정말 이 멤버를 제거하시겠습니까?")) {
      return
    }

    try {
      setDeletingMemberId(memberId)
      await deleteMember(memberId)
    } catch (err: any) {
      toast.error(err.message || "멤버 제거에 실패했습니다")
    } finally {
      setDeletingMemberId(null)
    }
  }
  
  // 멤버 권한 변경
  const handleChangePermission = async (permission: "소유자" | "관리자" | "멤버") => {
    if (!changePermissionDialog.memberId) return
    try {
      const newPermission = mapRoleToPermission(permission)
      await updateMember(changePermissionDialog.memberId, { permission: newPermission })
    } catch (err: any) {
      toast.error(err.message || "권한 변경에 실패했습니다")
      throw err
    }
  }

  // 권한 변경 다이얼로그 열기
  const openChangePermissionDialog = (memberId: string, memberName: string, currentPermission: "소유자" | "관리자" | "멤버") => {
    setChangePermissionDialog({
      open: true,
      memberId,
      memberName,
      currentPermission,
    })
  }

  const getMemberAvatar = (member: typeof members[0]) => {
    return member.profile?.avatar_url || null
  }

  const getMemberInitials = (member: typeof members[0]) => {
    const name = getMemberDisplayName(member)
    if (name === "이름 없음") return "?"
    return name.charAt(0).toUpperCase()
  }

  // 마지막 접속일 포맷팅
  const formatLastAccessAt = (lastAccessAt: string | null | undefined) => {
    if (!lastAccessAt) return "접속 기록 없음"
    
    try {
      const date = new Date(lastAccessAt)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      if (diffMins < 1) return "방금 전"
      if (diffMins < 60) return `${diffMins}분 전`
      if (diffHours < 24) return `${diffHours}시간 전`
      if (diffDays < 7) return `${diffDays}일 전`
      
      // 7일 이상 지난 경우 날짜 표시
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      return `${year}.${month}.${day} ${hours}:${minutes}`
    } catch {
      return "접속 기록 없음"
    }
  }

  // 아티스트가 로딩 중이거나 없으면 로딩 표시
  if (!artistContext || artistContext.loading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  // activeArtist가 없고 로딩이 완료되었으면 이미 리다이렉트 처리됨
  // 여기서는 프로젝트가 없으면 에러 메시지 표시
  if (!activeArtist) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">아티스트를 찾을 수 없습니다</p>
          <p className="text-sm text-muted-foreground mt-2">
            프로젝트 목록으로 돌아가는 중...
          </p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">프로젝트를 찾을 수 없습니다</p>
          <p className="text-sm text-muted-foreground mt-2">
            프로젝트 목록으로 돌아가는 중...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* 상단 네비게이션 탭 */}
      <ProjectNavTabs projectCode={projectCode} projectId={project.id} artistCode={artistCode} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="space-y-6 max-w-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">멤버</h2>
            <Button
              onClick={() => setIsAddMemberDialogOpen(true)}
              size="sm"
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              멤버 추가
            </Button>
          </div>

          {/* 멤버 테이블 */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th 
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => handleSort("이름")}
                    >
                      <div className="flex items-center gap-2">
                        이름
                        {sortColumn === "이름" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => handleSort("이메일")}
                    >
                      <div className="flex items-center gap-2">
                        이메일
                        {sortColumn === "이메일" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => handleSort("권한")}
                    >
                      <div className="flex items-center gap-2">
                        권한
                        {sortColumn === "권한" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => handleSort("마지막 접속일")}
                    >
                      <div className="flex items-center gap-2">
                        마지막 접속일
                        {sortColumn === "마지막 접속일" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </div>
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-sm">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="h-24 text-center text-muted-foreground">
                        멤버가 없습니다
                      </td>
                    </tr>
                  ) : (
                    sortedMembers.map((member) => {
                      const memberRole = mapPermissionToRole(member.permission)
                      // 해당 멤버가 프로젝트 소유자인지 확인
                      const isMemberOwner = memberRole === "소유자" && member.user_id === project.owner_id
                      // 현재 사용자가 프로젝트 소유자가 아니면 액션 제한
                      const canEdit = isCurrentUserOwner || !isMemberOwner
                      return (
                      <tr
                        key={member.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={getMemberAvatar(member) || undefined} alt={getMemberDisplayName(member)} />
                              <AvatarFallback>
                                {getMemberInitials(member)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{getMemberDisplayName(member)}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <span className="text-sm text-muted-foreground">{getMemberEmail(member)}</span>
                        </td>
                        <td className="p-4 align-middle">
                          <span className="text-sm">{memberRole}</span>
                        </td>
                        <td className="p-4 align-middle">
                          <span className="text-sm text-muted-foreground">
                            {formatLastAccessAt(member.last_access_at)}
                          </span>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  disabled={deletingMemberId === member.id}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEdit ? (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => openChangePermissionDialog(member.id, getMemberDisplayName(member), memberRole)}
                                    >
                                      권한 변경
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteMember(member.id)}
                                      className="text-destructive focus:text-destructive"
                                      disabled={deletingMemberId === member.id || (isMemberOwner && member.user_id === currentUserId)}
                                    >
                                      {deletingMemberId === member.id ? "제거 중..." : "멤버 제거"}
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem disabled>
                                    소유자만 수정할 수 있습니다
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
      </div>
      <AddProjectMemberDialog
        open={isAddMemberDialogOpen}
        onOpenChangeAction={setIsAddMemberDialogOpen}
        projectId={project.id}
        artistCode={artistCode}
        onMemberAdded={refetch}
      />
      {changePermissionDialog.memberId && (
        <ChangePermissionDialog
          open={changePermissionDialog.open}
          onOpenChange={(open) => setChangePermissionDialog(prev => ({ ...prev, open }))}
          currentPermission={changePermissionDialog.currentPermission!}
          memberName={changePermissionDialog.memberName}
          onConfirm={handleChangePermission}
        />
      )}
    </div>
  )
}

