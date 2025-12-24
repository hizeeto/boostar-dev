"use client"

import { useState, useEffect, useMemo } from "react"
import { useArtistRoles, type ArtistRole } from "@/hooks/use-artist-roles"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { toast } from "@/lib/toast"

type ChangeRoleDialogProps = {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  artistId: string | null
  memberId: string
  currentRoleIds: string[]
  onConfirmAction: (roleIds: string[]) => Promise<void>
  memberName: string
}

export function ChangeRoleDialog({
  open,
  onOpenChangeAction,
  artistId,
  memberId,
  currentRoleIds,
  onConfirmAction,
  memberName,
}: ChangeRoleDialogProps) {
  const { roles, loading } = useArtistRoles(artistId)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(currentRoleIds)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")

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
    const grouped: Record<string, ArtistRole[]> = {}
    
    enabledRoles.forEach((role) => {
      if (!grouped[role.category]) {
        grouped[role.category] = []
      }
      grouped[role.category].push(role)
    })
    
    // 카테고리별로 정렬
    const sorted: Record<string, ArtistRole[]> = {}
    Object.keys(grouped).sort().forEach((category) => {
      sorted[category] = grouped[category].sort((a, b) => {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order
        }
        return a.role_name.localeCompare(b.role_name, 'ko')
      })
    })
    
    return sorted
  }, [enabledRoles])

  // 카테고리 목록
  const categories = useMemo(() => {
    return Object.keys(rolesByCategory)
  }, [rolesByCategory])

  // 검색어에 따라 역할 필터링
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) {
      return enabledRoles
    }
    
    const query = searchQuery.toLowerCase().trim()
    return enabledRoles.filter(role => 
      role.role_name.toLowerCase().includes(query) ||
      role.category.toLowerCase().includes(query)
    )
  }, [enabledRoles, searchQuery])

  // 현재 카테고리의 역할 목록 (검색어 적용)
  const currentCategoryRoles = useMemo(() => {
    let roles = filteredRoles
    
    if (selectedCategory) {
      roles = roles.filter(role => role.category === selectedCategory)
    }
    
    return roles
  }, [selectedCategory, filteredRoles])

  // 선택된 역할 정보
  const selectedRoles = useMemo(() => {
    return enabledRoles.filter(role => selectedRoleIds.includes(role.id))
  }, [enabledRoles, selectedRoleIds])

  useEffect(() => {
    if (open) {
      setSelectedRoleIds(currentRoleIds)
      setSelectedCategory(null)
      setSearchQuery("")
    }
  }, [open, currentRoleIds])

  const handleToggleRole = (roleId: string) => {
    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId))
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId])
    }
  }

  const handleConfirm = async () => {
    try {
      await onConfirmAction(selectedRoleIds)
      onOpenChangeAction(false)
    } catch (err: any) {
      toast.error(err.message || "역할 변경에 실패했습니다")
      throw err
    }
  }

  const handleClose = () => {
    setSelectedRoleIds(currentRoleIds)
    setSelectedCategory(null)
    setSearchQuery("")
    onOpenChangeAction(false)
  }

  // 변경사항 확인
  const hasChanges = JSON.stringify([...selectedRoleIds].sort()) !== JSON.stringify([...currentRoleIds].sort())

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>역할 변경</DialogTitle>
          <DialogDescription>
            {memberName}님의 역할을 변경합니다. 여러 역할을 할당할 수 있습니다.
            <br />
            부여할 역할은 [역할] 탭에서 추가/삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
          {/* 2단 레이아웃 */}
          <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
            {/* 좌측: 카테고리 목록 */}
            <div className="w-48 flex-shrink-0 rounded-md border overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted/50 ${
                    selectedCategory === null 
                      ? 'bg-primary/10 text-primary font-medium border-l-2 border-l-primary' 
                      : ''
                  }`}
                >
                  전체
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted/50 ${
                      selectedCategory === category 
                        ? 'bg-primary/10 text-primary font-medium border-l-2 border-l-primary' 
                        : ''
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* 우측: 역할 목록 */}
            <div className="flex-1 rounded-md border overflow-hidden flex flex-col min-w-0">
              <div className="bg-muted/50 px-4 py-2 border-b space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    {selectedCategory === null ? '전체 역할' : selectedCategory}
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      ({currentCategoryRoles.length}개)
                    </span>
                  </h3>
                </div>
                {/* 검색 입력 필드 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="역할 이름 또는 카테고리로 검색..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      // 검색어 입력 시 카테고리 선택을 전체로 변경
                      if (e.target.value.trim() && selectedCategory !== null) {
                        setSelectedCategory(null)
                      }
                    }}
                    className="pl-9 h-9"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {currentCategoryRoles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">역할이 없습니다</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {currentCategoryRoles.map((role) => {
                      const isSelected = selectedRoleIds.includes(role.id)
                      
                      return (
                        <div
                          key={role.id}
                          className={`flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-primary/5 border border-primary/20' : ''
                          }`}
                          onClick={() => handleToggleRole(role.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleRole(role.id)}
                            id={`role-${role.id}`}
                          />
                          <label
                            htmlFor={`role-${role.id}`}
                            className={`text-sm cursor-pointer flex-1 ${
                              isSelected ? 'font-medium' : ''
                            }`}
                          >
                            {role.role_name}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 선택된 역할 표시 영역 (하단) */}
          {selectedRoles.length > 0 && (
            <div className="flex-shrink-0">
              <div className="p-3 border rounded-md bg-muted/30">
                <div className="text-xs font-semibold text-muted-foreground mb-2">선택된 역할</div>
                <div className="flex flex-wrap gap-2">
                  {selectedRoles.map((role) => (
                    <Badge
                      key={role.id}
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      <span>{role.role_name}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleRole(role.id)}
                        className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !hasChanges}
          >
            변경
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
