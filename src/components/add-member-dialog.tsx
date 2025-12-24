"use client"

import { useState, useEffect, useMemo } from "react"
import { useArtistContext } from "@/hooks/use-artist-context"
import { useArtistMembers } from "@/hooks/use-artist-members"
import { useArtistRoles } from "@/hooks/use-artist-roles"
import { createClient } from "@/lib/supabase/client"
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
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"

type AddMemberDialogProps = {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  artistCode: string
}

export function AddMemberDialog({ open, onOpenChangeAction, artistCode }: AddMemberDialogProps) {
  const { artists, activeArtist } = useArtistContext()
  const currentArtist = artists.find((a) => a.artist_code === artistCode) || activeArtist
  const { addMember, refetch, updateMemberRoles } = useArtistMembers(currentArtist?.id || null)
  const { roles, loading: rolesLoading } = useArtistRoles(currentArtist?.id || null)
  
  const [email, setEmail] = useState("")
  const [permission, setPermission] = useState<"소유자" | "관리자" | "멤버">("멤버")
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [isRolePopoverOpen, setIsRolePopoverOpen] = useState(false)

  // 활성화된 역할만 필터링
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

  // 역할을 카테고리별로 그룹화
  const rolesByCategory = useMemo(() => {
    const grouped: Record<string, typeof enabledRoles> = {}
    
    enabledRoles.forEach((role) => {
      if (!grouped[role.category]) {
        grouped[role.category] = []
      }
      grouped[role.category].push(role)
    })
    
    return grouped
  }, [enabledRoles])

  // 선택된 역할 정보
  const selectedRoles = useMemo(() => {
    return enabledRoles.filter(role => selectedRoleIds.includes(role.id))
  }, [enabledRoles, selectedRoleIds])

  useEffect(() => {
    if (!open) {
      setEmail("")
      setPermission("멤버")
      setSelectedRoleIds([])
      setIsRolePopoverOpen(false)
    }
  }, [open])

  const handleToggleRole = (roleId: string) => {
    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId))
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId])
    }
  }

  const handleRemoveRole = (roleId: string) => {
    setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId))
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

  const handleAdd = async () => {
    if (!email.trim()) {
      toast.error("이메일을 입력해주세요")
      return
    }

    if (!currentArtist) {
      toast.error("아티스트를 찾을 수 없습니다")
      return
    }

    setIsAdding(true)
    
    try {
      const supabase = createClient()
      
      // 이메일로 사용자 찾기
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle()

      const dbPermission = mapRoleToPermission(permission)
      
      if (profile) {
        // 기존 사용자인 경우
        const newMember = await addMember(profile.id, permission, dbPermission)
        // 역할 할당
        if (newMember && selectedRoleIds.length > 0) {
          await updateMemberRoles(newMember.id, selectedRoleIds)
        }
        await refetch()
        handleClose()
      } else {
        // 외부 비회원인 경우 - API를 통해 이메일 초대
        const response = await fetch('/api/invite-member', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            artistId: currentArtist.id,
            role: permission,
            permission: dbPermission,
            roleIds: selectedRoleIds,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || "멤버 초대에 실패했습니다")
        }

        await refetch()
        toast.success("초대 이메일이 전송되었습니다")
        handleClose()
      }
    } catch (err: any) {
      toast.error(err.message || "멤버 초대에 실패했습니다")
    } finally {
      setIsAdding(false)
    }
  }

  const handleClose = () => {
    setEmail("")
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>멤버 초대</DialogTitle>
          <DialogDescription>
            초대한 사용자에게 메일이 발송됩니다.
            <br />
            초대 메일의 링크를 통해 정보 등록 후 아티스트 스페이스에 접속할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Field>
            <FieldLabel>이메일</FieldLabel>
            <Input
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isAdding}
            />
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

          {!rolesLoading && enabledRoles.length > 0 && (
            <Field>
              <FieldLabel>역할 (선택사항)</FieldLabel>
              <Popover open={isRolePopoverOpen} onOpenChange={setIsRolePopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                      selectedRoleIds.length === 0 && "text-muted-foreground"
                    )}
                    disabled={isAdding}
                  >
                    <span>
                      {selectedRoleIds.length === 0
                        ? "역할을 선택하세요"
                        : `${selectedRoleIds.length}개 선택됨`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-4">
                      {Object.entries(rolesByCategory).map(([category, categoryRoles]) => (
                        <div key={category}>
                          <div className="text-sm font-medium text-muted-foreground mb-2 px-2">
                            {category}
                          </div>
                          <div className="space-y-1">
                            {categoryRoles.map((role) => (
                              <div
                                key={role.id}
                                className="flex items-center space-x-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                                onClick={() => handleToggleRole(role.id)}
                              >
                                <Checkbox
                                  id={`role-${role.id}`}
                                  checked={selectedRoleIds.includes(role.id)}
                                  onCheckedChange={() => handleToggleRole(role.id)}
                                />
                                <label
                                  htmlFor={`role-${role.id}`}
                                  className="text-sm font-normal leading-none cursor-pointer flex-1"
                                >
                                  {role.role_name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {selectedRoles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRoles.map((role) => (
                    <Badge
                      key={role.id}
                      variant="secondary"
                      className="text-xs"
                    >
                      {role.role_name}
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(role.id)}
                        className="ml-1.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                        disabled={isAdding}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </Field>
          )}
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
            disabled={!email.trim() || isAdding}
          >
            {isAdding ? "초대 중..." : "초대"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

