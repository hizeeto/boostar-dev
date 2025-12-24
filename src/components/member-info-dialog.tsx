"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArtistMember } from "@/hooks/use-artist-members"

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

interface MemberInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: ArtistMember | null
}

export function MemberInfoDialog({ open, onOpenChange, member }: MemberInfoDialogProps) {
  if (!member) return null

  const getMemberDisplayName = () => {
    return member.profile?.full_name || member.profile?.nickname || "이름 없음"
  }

  const getMemberEmail = () => {
    return member.profile?.email || "이메일 없음"
  }

  const getMemberAvatar = () => {
    return member.profile?.avatar_url || null
  }

  const getMemberInitials = () => {
    const name = getMemberDisplayName()
    if (name === "이름 없음") return "?"
    return name.charAt(0).toUpperCase()
  }

  const memberRole = mapPermissionToRole(member.permission)

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>멤버 정보</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* 프로필 섹션 */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage 
                src={getMemberAvatar() || undefined} 
                alt={getMemberDisplayName()} 
              />
              <AvatarFallback className="text-2xl">
                {getMemberInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-lg font-semibold">{getMemberDisplayName()}</h3>
              <p className="text-sm text-muted-foreground">{getMemberEmail()}</p>
            </div>
          </div>

          {/* 정보 섹션 */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">권한</label>
              <div className="mt-1">
                <span className="text-sm">{memberRole}</span>
              </div>
            </div>

            {member.artist_roles && member.artist_roles.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">역할</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {member.artist_roles.map((role) => (
                    <Badge key={role.id} variant="secondary" className="text-xs py-0">
                      {role.role_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">마지막 접속일</label>
              <div className="mt-1">
                <span className="text-sm">{formatLastAccessAt(member.last_access_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

