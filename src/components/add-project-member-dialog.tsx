"use client"

import { useState, useEffect, useMemo } from "react"
import { useArtistContext } from "@/hooks/use-artist-context"
import { useProjectMembers } from "@/hooks/use-project-members"
import { useArtistMembers } from "@/hooks/use-artist-members"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"

type AddProjectMemberDialogProps = {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  projectId: string
  artistCode: string
  onMemberAdded?: () => void | Promise<void>
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

export function AddProjectMemberDialog({ open, onOpenChangeAction, projectId, artistCode, onMemberAdded }: AddProjectMemberDialogProps) {
  const { artists, activeArtist } = useArtistContext()
  const currentArtist = artists.find((a) => a.artist_code === artistCode) || activeArtist
  const { addMember, refetch } = useProjectMembers(projectId)
  const { members: artistMembers, loading: artistMembersLoading } = useArtistMembers(currentArtist?.id || null)
  const { members: projectMembers } = useProjectMembers(projectId)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [permission, setPermission] = useState<"소유자" | "관리자" | "멤버">("멤버")
  const [isAdding, setIsAdding] = useState(false)

  // 이미 프로젝트 멤버인 아티스트 멤버 필터링
  const availableArtistMembers = useMemo(() => {
    const projectMemberUserIds = new Set(projectMembers.map(pm => pm.user_id))
    return artistMembers.filter(am => !projectMemberUserIds.has(am.user_id))
  }, [artistMembers, projectMembers])

  // 검색 필터링된 멤버 목록
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableArtistMembers
    }
    
    const query = searchQuery.toLowerCase()
    return availableArtistMembers.filter(member => {
      const name = member.profile?.full_name || member.profile?.nickname || ""
      const email = member.profile?.email || ""
      return name.toLowerCase().includes(query) || email.toLowerCase().includes(query)
    })
  }, [availableArtistMembers, searchQuery])

  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setSelectedMemberIds([])
      setPermission("멤버")
    }
  }, [open])

  const handleToggleMember = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      setSelectedMemberIds(selectedMemberIds.filter(id => id !== memberId))
    } else {
      setSelectedMemberIds([...selectedMemberIds, memberId])
    }
  }

  const handleRemoveMember = (memberId: string) => {
    setSelectedMemberIds(selectedMemberIds.filter(id => id !== memberId))
  }

  const handleAdd = async () => {
    if (selectedMemberIds.length === 0) {
      toast.error("추가할 멤버를 선택해주세요")
      return
    }

    if (!currentArtist) {
      toast.error("아티스트를 찾을 수 없습니다")
      return
    }

    setIsAdding(true)
    
    try {
      const dbPermission = mapRoleToPermission(permission)
      
      // 선택된 모든 멤버 추가
      await Promise.all(
        selectedMemberIds.map(async (memberId) => {
          const artistMember = artistMembers.find(am => am.id === memberId)
          if (!artistMember) return
          
          await addMember(artistMember.user_id, permission, dbPermission)
        })
      )
      
      // 멤버 목록 강제 새로고침
      await refetch()
      
      // 부모 컴포넌트의 refetch도 호출
      if (onMemberAdded) {
        await onMemberAdded()
      }
      
      handleClose()
      toast.success(`${selectedMemberIds.length}명의 멤버가 추가되었습니다`)
    } catch (err: any) {
      toast.error(err.message || "멤버 추가에 실패했습니다")
    } finally {
      setIsAdding(false)
    }
  }

  const handleClose = () => {
    setSearchQuery("")
    setSelectedMemberIds([])
    setPermission("멤버")
    onOpenChangeAction(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose()
    } else {
      onOpenChangeAction(open)
    }
  }

  const getMemberDisplayName = (member: typeof artistMembers[0]) => {
    return member.profile?.full_name || member.profile?.nickname || "이름 없음"
  }

  const getMemberEmail = (member: typeof artistMembers[0]) => {
    return member.profile?.email || "이메일 없음"
  }

  const getMemberAvatar = (member: typeof artistMembers[0]) => {
    return member.profile?.avatar_url || null
  }

  const getMemberInitials = (member: typeof artistMembers[0]) => {
    const name = getMemberDisplayName(member)
    if (name === "이름 없음") return "?"
    return name.charAt(0).toUpperCase()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>멤버 추가</DialogTitle>
          <DialogDescription>
            아티스트 스페이스의 멤버를 프로젝트 멤버로 추가합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Field>
            <FieldLabel>검색</FieldLabel>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="이름 또는 이메일로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isAdding || artistMembersLoading}
                className="pl-9"
              />
            </div>
          </Field>

          <Field>
            <FieldLabel>권한</FieldLabel>
            <Select value={permission} onValueChange={(value: "소유자" | "관리자" | "멤버") => setPermission(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="소유자">소유자</SelectItem>
                <SelectItem value="관리자">관리자</SelectItem>
                <SelectItem value="멤버">멤버</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>아티스트 멤버 선택</FieldLabel>
            {artistMembersLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                로딩 중...
              </div>
            ) : availableArtistMembers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                추가할 수 있는 아티스트 멤버가 없습니다.
                <br />
                모든 아티스트 멤버가 이미 프로젝트 멤버로 추가되어 있습니다.
              </div>
            ) : (
              <>
                <ScrollArea className="h-64 border rounded-md">
                  <div className="p-2 space-y-1">
                    {filteredMembers.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        검색 결과가 없습니다
                      </div>
                    ) : (
                      filteredMembers.map((member) => {
                        const isSelected = selectedMemberIds.includes(member.id)
                        return (
                          <div
                            key={member.id}
                            className={cn(
                              "flex items-center space-x-3 px-3 py-2 rounded-sm hover:bg-accent cursor-pointer",
                              isSelected && "bg-accent"
                            )}
                            onClick={() => handleToggleMember(member.id)}
                          >
                            <Checkbox
                              id={`member-${member.id}`}
                              checked={isSelected}
                              onCheckedChange={() => handleToggleMember(member.id)}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={getMemberAvatar(member) || undefined} alt={getMemberDisplayName(member)} />
                              <AvatarFallback>
                                {getMemberInitials(member)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {getMemberDisplayName(member)}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {getMemberEmail(member)}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
                {selectedMemberIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedMemberIds.map((memberId) => {
                      const member = artistMembers.find(m => m.id === memberId)
                      if (!member) return null
                      return (
                        <Badge
                          key={memberId}
                          variant="secondary"
                          className="text-xs"
                        >
                          {getMemberDisplayName(member)}
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(memberId)}
                            className="ml-1.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                            disabled={isAdding}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </Field>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isAdding}
          >
            취소
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selectedMemberIds.length === 0 || isAdding}
          >
            {isAdding ? "추가 중..." : `${selectedMemberIds.length > 0 ? `${selectedMemberIds.length}명 추가` : "추가"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

