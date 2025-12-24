"use client"

import { useState, useEffect } from "react"
import { useArtistContext } from "@/hooks/use-artist-context"
import { useArtistMembers, ArtistMember } from "@/hooks/use-artist-members"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Plus } from "lucide-react"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { MemberInfoDialog } from "@/components/member-info-dialog"
import { Badge } from "@/components/ui/badge"
import { AddMemberDialog } from "@/components/add-member-dialog"
import { createClient } from "@/lib/supabase/client"

const MAX_VISIBLE_AVATARS = 4

interface ArtistMembersHeaderProps {
  artistCode?: string | null
}

export function ArtistMembersHeader({ artistCode: propArtistCode }: ArtistMembersHeaderProps = {}) {
  const params = useParams()
  const { artists, activeArtist } = useArtistContext()
  const artistCode = propArtistCode || (params.artistCode as string | undefined)
  const [selectedMember, setSelectedMember] = useState<ArtistMember | null>(null)
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [canInviteMembers, setCanInviteMembers] = useState(false)
  
  // 현재 아티스트 찾기
  const currentArtist = artistCode 
    ? artists.find((a) => a.artist_code === artistCode) || activeArtist
    : null
  
  // 멤버 데이터 로드
  const { members, loading } = useArtistMembers(currentArtist?.id || null)

  // 현재 사용자 ID 가져오기
  useEffect(() => {
    const getCurrentUser = async () => {
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      
      if (demoUser) {
        console.log('[ArtistMembersHeader] 데모 사용자 모드:', DEMO_USER_ID)
        setCurrentUserId(DEMO_USER_ID)
        return
      }
      
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [])

  // 멤버 초대 권한 확인
  useEffect(() => {
    if (!currentUserId || !currentArtist || !members.length) {
      setCanInviteMembers(false)
      return
    }

    // 아티스트 소유자인지 확인
    const isOwner = currentUserId === currentArtist.user_id
    
    // 현재 사용자가 멤버인지 확인
    const currentUserMember = members.find(m => m.user_id === currentUserId)
    
    // 권한 확인: 소유자이거나 전체 권한/편집 권한을 가진 멤버
    const hasPermission = isOwner || 
      (currentUserMember && (
        currentUserMember.permission === "전체 권한" || 
        currentUserMember.permission === "편집 권한"
      ))
    
    setCanInviteMembers(hasPermission || false)
  }, [currentUserId, currentArtist, members])
  
  // 멤버 정보 가져오기
  const getMemberDisplayName = (member: typeof members[0]) => {
    return member.profile?.full_name || member.profile?.nickname || "이름 없음"
  }

  const getMemberAvatar = (member: typeof members[0]) => {
    return member.profile?.avatar_url || null
  }

  const getMemberInitials = (member: typeof members[0]) => {
    const name = getMemberDisplayName(member)
    if (name === "이름 없음") return "?"
    return name.charAt(0).toUpperCase()
  }

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

  const handleMemberClick = (member: ArtistMember) => {
    setSelectedMember(member)
    setIsMemberDialogOpen(true)
  }
  
  // 표시할 멤버와 나머지 카운트
  const visibleMembers = members.slice(0, MAX_VISIBLE_AVATARS)
  const remainingCount = Math.max(0, members.length - MAX_VISIBLE_AVATARS)
  
  if (!currentArtist || loading) {
    return null
  }
  
  if (members.length === 0) {
    return null
  }
  
  return (
    <div className="flex items-center gap-2 ml-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center px-2 py-1.5 rounded-full border border-border hover:bg-muted transition-colors focus:ring-0 focus-visible:ring-0 outline-none cursor-pointer">
            <div className="flex items-center -space-x-2">
              {visibleMembers.map((member) => (
                <Avatar 
                  key={member.id} 
                  className="h-7 w-7 border-2 border-background"
                >
                  <AvatarImage 
                    src={getMemberAvatar(member) || undefined} 
                    alt={getMemberDisplayName(member)} 
                  />
                  <AvatarFallback className="text-xs">
                    {getMemberInitials(member)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {remainingCount > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                +{remainingCount}
              </span>
            )}
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground",
              remainingCount > 0 ? "ml-1" : "ml-0"
            )} />
          </button>
        </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>
              소속 멤버({members.length}명)
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {members.map((member) => {
              const memberRole = mapPermissionToRole(member.permission)
              const showRoleChip = memberRole === "소유자" || memberRole === "관리자"
              const roles = member.artist_roles && member.artist_roles.length > 0 
                ? member.artist_roles.slice(0, 2).map(r => r.role_name)
                : []
              
              return (
                <DropdownMenuItem 
                  key={member.id}
                  className="flex items-center justify-between gap-2 cursor-pointer"
                  onClick={() => handleMemberClick(member)}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <Avatar className="h-6 w-6 shrink-0 mr-2">
                      <AvatarImage 
                        src={getMemberAvatar(member) || undefined} 
                        alt={getMemberDisplayName(member)} 
                      />
                      <AvatarFallback className="text-xs">
                        {getMemberInitials(member)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate">{getMemberDisplayName(member)}</span>
                    {showRoleChip && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 ml-1">
                        {memberRole}
                      </Badge>
                    )}
                  </div>
                  {roles.length > 0 && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {roles.join(" · ")}
                    </span>
                  )}
                </DropdownMenuItem>
              )
            })}
            {canInviteMembers && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setIsAddMemberDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">멤버 초대</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      <MemberInfoDialog
        open={isMemberDialogOpen}
        onOpenChange={setIsMemberDialogOpen}
        member={selectedMember}
      />
      {artistCode && (
        <AddMemberDialog
          open={isAddMemberDialogOpen}
          onOpenChangeAction={setIsAddMemberDialogOpen}
          artistCode={artistCode as string}
        />
      )}
    </div>
  )
}

