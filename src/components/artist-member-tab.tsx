"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { useArtistContext } from "@/hooks/use-artist-context"
import { useArtistMembers } from "@/hooks/use-artist-members"
import { useArtistRoles } from "@/hooks/use-artist-roles"
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
import { AddMemberDialog } from "@/components/add-member-dialog"
import { ChangeRoleDialog } from "@/components/change-role-dialog"
import { ChangePermissionDialog } from "@/components/change-permission-dialog"

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

export function ArtistMemberTab() {
  const params = useParams()
  const { artists, loading: artistsLoading, activeArtist } = useArtistContext()
  const artistCode = params.artistCode as string
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [changeRoleDialog, setChangeRoleDialog] = useState<{ open: boolean; memberId: string | null; memberName: string; currentRoleIds: string[] }>({
    open: false,
    memberId: null,
    memberName: "",
    currentRoleIds: [],
  })
  const [changePermissionDialog, setChangePermissionDialog] = useState<{ open: boolean; memberId: string | null; memberName: string; currentPermission: "소유자" | "관리자" | "멤버" | null }>({
    open: false,
    memberId: null,
    memberName: "",
    currentPermission: null,
  })
  
  // 현재 아티스트 찾기
  const currentArtist = artists.find((a) => a.artist_code === artistCode) || activeArtist
  
  // 현재 로그인한 사용자 ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  useEffect(() => {
    const getCurrentUser = async () => {
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      
      if (demoUser) {
        console.log('[ArtistMemberTab] 데모 사용자 모드:', DEMO_USER_ID)
        setCurrentUserId(DEMO_USER_ID)
        return
      }
      
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [])
  
  // 현재 사용자가 아티스트 소유자인지 확인
  const isCurrentUserOwner = currentUserId === currentArtist?.user_id
  
  // 멤버 데이터 로드
  const { members, loading: membersLoading, updateMember, updateMemberRoles, deleteMember, addMember, refetch } = useArtistMembers(currentArtist?.id || null)
  
  // 역할 데이터 로드
  const { roles, loading: rolesLoading } = useArtistRoles(currentArtist?.id || null)
  
  // 아티스트 소유자를 멤버로 자동 추가
  const [isAddingOwner, setIsAddingOwner] = useState(false)
  
  useEffect(() => {
    const addOwnerAsMember = async () => {
      if (!currentArtist || membersLoading || !addMember || isAddingOwner) return
      
      // 소유자가 멤버 목록에 없으면 자동으로 추가
      const ownerExists = members.some(m => m.user_id === currentArtist.user_id)
      if (!ownerExists) {
        setIsAddingOwner(true)
        try {
          await addMember(currentArtist.user_id, "멤버", "전체 권한")
          // 멤버 목록 다시 로드
          await refetch()
        } catch (err: any) {
          // 이미 추가되었거나 오류가 발생한 경우 멤버 목록 다시 로드 시도
          if (err.message?.includes("이미 초대된 멤버") || err.code === '23505') {
            await refetch()
          } else {
            console.error("소유자 멤버 추가 실패:", err)
          }
        } finally {
          setIsAddingOwner(false)
        }
      }
    }
    
    if (currentArtist && !membersLoading) {
      addOwnerAsMember()
    }
  }, [currentArtist?.id, currentArtist?.user_id, members, membersLoading, addMember, refetch, isAddingOwner])
  
  // 정렬 상태
  type SortColumn = "이름" | "이메일" | "역할" | "권한" | "마지막 접속일" | null
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
        case "역할":
          // 역할명으로 정렬 (첫 번째 역할 기준)
          const aRoleName = a.artist_roles && a.artist_roles.length > 0 
            ? a.artist_roles[0].role_name 
            : ""
          const bRoleName = b.artist_roles && b.artist_roles.length > 0 
            ? b.artist_roles[0].role_name 
            : ""
          aValue = aRoleName.toLowerCase()
          bValue = bRoleName.toLowerCase()
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
  }, [members, sortColumn, sortDirection, getMemberDisplayName, getMemberEmail])

  // 실제 멤버 데이터만 사용 (임시 데이터 제거)
  const membersWithOwner = sortedMembers
  
  // 디버깅: 멤버 데이터 확인
  useEffect(() => {
    console.log("멤버 데이터:", {
      currentArtistId: currentArtist?.id,
      membersCount: members.length,
      members: members,
      membersLoading,
      artistsLoading
    })
  }, [currentArtist?.id, members, membersLoading, artistsLoading])
  
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)
  
  // 멤버 삭제
  const handleDeleteMember = async (memberId: string) => {
    const member = membersWithOwner.find(m => m.id === memberId)
    const memberRole = member ? mapPermissionToRole(member.permission) : null
    
    // 아티스트 소유자 본인은 삭제할 수 없음 (소유자가 다른 소유자를 삭제하는 것은 가능)
    if (member && memberRole === "소유자" && member.user_id === currentArtist?.user_id && member.user_id === currentUserId) {
      toast.error("아티스트 소유자 본인은 제거할 수 없습니다")
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

  // 멤버 역할 변경 (여러 개)
  const handleChangeArtistRole = async (roleIds: string[]) => {
    if (!changeRoleDialog.memberId) return
    try {
      await updateMemberRoles(changeRoleDialog.memberId, roleIds)
    } catch (err: any) {
      toast.error(err.message || "역할 변경에 실패했습니다")
      throw err
    }
  }

  // 역할 변경 다이얼로그 열기
  const openChangeRoleDialog = (memberId: string, memberName: string, currentRoleIds: string[]) => {
    setChangeRoleDialog({
      open: true,
      memberId,
      memberName,
      currentRoleIds,
    })
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

  // 활성화된 역할 목록 가져오기
  const enabledRoles = useMemo(() => {
    return roles.filter(role => role.is_enabled).sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category, 'ko')
      }
      if (a.display_order !== b.display_order) {
        return a.display_order - b.display_order
      }
      return a.role_name.localeCompare(b.role_name, 'ko')
    })
  }, [roles])

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

  const loading = artistsLoading || membersLoading || rolesLoading

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">아티스트 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!currentArtist) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <p className="text-lg font-medium">아티스트를 찾을 수 없습니다</p>
          <p className="text-sm text-muted-foreground">
            {artists.length === 0 
              ? "아직 생성된 아티스트 스페이스가 없습니다." 
              : "요청하신 아티스트 스페이스를 찾을 수 없습니다."}
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            뒤로 가기
          </Button>
        </div>
      </div>
    )
  }

  return (
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
              멤버 초대
            </Button>
          </div>

          {/* 멤버 테이블 */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
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
                      onClick={() => handleSort("역할")}
                    >
                      <div className="flex items-center gap-2">
                        역할
                        {sortColumn === "역할" ? (
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
                  {membersWithOwner.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="h-24 text-center text-muted-foreground">
                        멤버가 없습니다
                      </td>
                    </tr>
                  ) : (
                    membersWithOwner.map((member) => {
                      const memberRole = mapPermissionToRole(member.permission)
                      // 해당 멤버가 아티스트 소유자인지 확인
                      const isMemberOwner = memberRole === "소유자" && member.user_id === currentArtist?.user_id
                      // 현재 사용자가 아티스트 소유자가 아니면 액션 제한
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
                          {member.artist_roles && member.artist_roles.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {member.artist_roles.map((role) => (
                                <Badge key={role.id} variant="secondary" className="text-xs">
                                  {role.role_name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
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
                                      onClick={() => openChangeRoleDialog(
                                        member.id, 
                                        getMemberDisplayName(member), 
                                        member.artist_roles?.map(r => r.id) || []
                                      )}
                                    >
                                      역할 변경
                                    </DropdownMenuItem>
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
      <AddMemberDialog
        open={isAddMemberDialogOpen}
        onOpenChangeAction={setIsAddMemberDialogOpen}
        artistCode={artistCode}
      />
      {changeRoleDialog.memberId && (
        <ChangeRoleDialog
          open={changeRoleDialog.open}
          onOpenChangeAction={(open) => setChangeRoleDialog(prev => ({ ...prev, open }))}
          artistId={currentArtist?.id || null}
          memberId={changeRoleDialog.memberId}
          currentRoleIds={changeRoleDialog.currentRoleIds}
          memberName={changeRoleDialog.memberName}
          onConfirmAction={handleChangeArtistRole}
        />
      )}
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

