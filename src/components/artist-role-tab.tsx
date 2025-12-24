"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { useArtistContext } from "@/hooks/use-artist-context"
import { useArtistRoles, DEFAULT_ROLES, type ArtistRole } from "@/hooks/use-artist-roles"
import { createClient } from "@/lib/supabase/client"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/lib/toast"
import { Plus, X, Search, Trash2 } from "lucide-react"

export function ArtistRoleTab() {
  const params = useParams()
  const { artists, loading: artistsLoading, activeArtist } = useArtistContext()
  const artistCode = params.artistCode as string
  
  // 현재 아티스트 찾기
  const currentArtist = artists.find((a) => a.artist_code === artistCode) || activeArtist
  
  // 역할 데이터 로드
  const { roles, loading: rolesLoading, initializeRoles, toggleRole, refetch, addRole, deleteRole } = useArtistRoles(currentArtist?.id || null)
  
  // 초기화 중 상태
  const [initializing, setInitializing] = useState(false)
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  
  // 선택된 카테고리
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  // 검색어
  const [searchQuery, setSearchQuery] = useState("")
  
  // 역할 추가 다이얼로그 상태
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [isAddingRole, setIsAddingRole] = useState(false)
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)
  
  // 로컬 상태로 역할 활성화 상태 관리 (저장 전까지)
  const [localRoleStates, setLocalRoleStates] = useState<Record<string, boolean>>({})
  
  // 변경사항 확인
  const hasChanges = useMemo(() => {
    return roles.some(role => {
      const localState = localRoleStates[role.id]
      return localState !== undefined && localState !== role.is_enabled
    })
  }, [roles, localRoleStates])

  // 검색어에 따라 역할 필터링
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) {
      return roles
    }
    
    const query = searchQuery.toLowerCase().trim()
    return roles.filter(role => 
      role.role_name.toLowerCase().includes(query) ||
      role.category.toLowerCase().includes(query)
    )
  }, [roles, searchQuery])

  // 역할을 카테고리별로 그룹화
  const rolesByCategory = useMemo(() => {
    const grouped: Record<string, ArtistRole[]> = {}
    
    // 기본 카테고리 순서 유지
    const categoryOrder = Object.keys(DEFAULT_ROLES)
    
    filteredRoles.forEach((role) => {
      if (!grouped[role.category]) {
        grouped[role.category] = []
      }
      grouped[role.category].push(role)
    })
    
    // 카테고리별로 정렬 (기본 순서 유지)
    const sorted: Record<string, ArtistRole[]> = {}
    categoryOrder.forEach((category) => {
      if (grouped[category]) {
        sorted[category] = grouped[category].sort((a, b) => {
          // display_order로 정렬, 같으면 role_name으로 정렬
          if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order
          }
          return a.role_name.localeCompare(b.role_name, 'ko')
        })
      }
    })
    
    // 기본 카테고리에 없는 카테고리도 추가
    Object.keys(grouped).forEach((category) => {
      if (!sorted[category]) {
        sorted[category] = grouped[category].sort((a, b) => {
          if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order
          }
          return a.role_name.localeCompare(b.role_name, 'ko')
        })
      }
    })
    
    return sorted
  }, [filteredRoles])
  
  // 카테고리 목록 (직접 입력은 항상 마지막에)
  const categories = useMemo(() => {
    const cats = Object.keys(rolesByCategory)
    const customIndex = cats.indexOf('직접 입력')
    
    // 직접 입력을 제거하고 마지막에 추가 (역할이 없어도 항상 표시)
    const withoutCustom = cats.filter(cat => cat !== '직접 입력')
    return [...withoutCustom, '직접 입력']
  }, [rolesByCategory])
  
  // 현재 카테고리의 역할 목록
  const currentCategoryRoles = useMemo(() => {
    if (!selectedCategory) return []
    return rolesByCategory[selectedCategory] || []
  }, [selectedCategory, rolesByCategory])
  
  // 선택된 역할 목록
  const selectedRoles = useMemo(() => {
    return roles.filter(role => {
      const isEnabled = localRoleStates[role.id] !== undefined 
        ? localRoleStates[role.id] 
        : role.is_enabled
      return isEnabled
    })
  }, [roles, localRoleStates])
  
  // 로컬 상태 초기화
  useEffect(() => {
    if (roles.length > 0) {
      const states: Record<string, boolean> = {}
      roles.forEach(role => {
        states[role.id] = role.is_enabled
      })
      setLocalRoleStates(states)
    }
  }, [roles])
  
  // 초기 카테고리 선택 (전체)
  useEffect(() => {
    if (roles.length > 0 && selectedCategory === null && categories.length > 0) {
      // 초기값은 null (전체)로 유지
      // 이미 null이면 변경하지 않음
    }
  }, [roles.length, categories.length])

  // 역할이 없으면 초기화
  useEffect(() => {
    if (!rolesLoading && !artistsLoading && currentArtist && roles.length === 0) {
      handleInitializeRoles()
    }
  }, [rolesLoading, artistsLoading, currentArtist, roles.length])

  // 역할 초기화
  const handleInitializeRoles = async () => {
    if (!currentArtist) return
    
    try {
      setInitializing(true)
      await initializeRoles()
    } catch (err: any) {
      console.error("역할 초기화 실패:", err)
      toast.error(err.message || "역할 초기화에 실패했습니다")
    } finally {
      setInitializing(false)
    }
  }

  // 역할 토글 (로컬 상태만 변경)
  const handleToggleRole = (roleId: string) => {
    setLocalRoleStates(prev => ({
      ...prev,
      [roleId]: !prev[roleId]
    }))
  }

  // 전체 선택
  const handleSelectAll = () => {
    const newStates: Record<string, boolean> = {}
    roles.forEach(role => {
      newStates[role.id] = true
    })
    setLocalRoleStates(newStates)
  }

  // 전체 해제
  const handleDeselectAll = () => {
    const newStates: Record<string, boolean> = {}
    roles.forEach(role => {
      newStates[role.id] = false
    })
    setLocalRoleStates(newStates)
  }

  // 저장
  const handleSave = async () => {
    if (!currentArtist || !hasChanges) return

    try {
      setSaving(true)
      const supabase = createClient()
      
      // 변경된 역할들만 업데이트
      const updates = roles
        .filter(role => {
          const localState = localRoleStates[role.id]
          return localState !== undefined && localState !== role.is_enabled
        })
        .map(role => ({
          id: role.id,
          is_enabled: localRoleStates[role.id] || false
        }))

      if (updates.length > 0) {
        await Promise.all(
          updates.map(update =>
            supabase
              .from('artist_roles')
              .update({ is_enabled: update.is_enabled })
              .eq('id', update.id)
              .eq('artist_id', currentArtist.id)
          )
        )
      }

      await refetch()
      toast.success(`${updates.length}개의 역할이 저장되었습니다`)
    } catch (err: any) {
      console.error("역할 저장 실패:", err)
      toast.error(err.message || "역할 저장에 실패했습니다")
    } finally {
      setSaving(false)
    }
  }

  // 역할 추가
  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("역할 이름을 입력해주세요")
      return
    }

    try {
      setIsAddingRole(true)
      await addRole(newRoleName.trim())
      setNewRoleName("")
      setIsAddRoleDialogOpen(false)
    } catch (err: any) {
      toast.error(err.message || "역할 추가에 실패했습니다")
    } finally {
      setIsAddingRole(false)
    }
  }

  // 역할 삭제
  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("정말 이 역할을 삭제하시겠습니까?")) {
      return
    }

    try {
      setDeletingRoleId(roleId)
      await deleteRole(roleId)
    } catch (err: any) {
      toast.error(err.message || "역할 삭제에 실패했습니다")
    } finally {
      setDeletingRoleId(null)
    }
  }

  // 권한 확인 (소유자 또는 관리자만 역할 관리 가능)
  const canManageRoles = useMemo(() => {
    if (!currentArtist) return false
    
    const supabase = createClient()
    // 실제로는 현재 사용자가 소유자이거나 관리자인지 확인해야 하지만,
    // 여기서는 간단히 소유자만 가능하도록 처리
    // 실제 구현에서는 useArtistMembers 훅을 사용하여 권한 확인
    return true // 임시로 true, 나중에 권한 체크 추가
  }, [currentArtist])

  const loading = artistsLoading || rolesLoading

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
            <div>
              <h2 className="text-2xl font-semibold">역할</h2>
              <p className="text-sm text-muted-foreground mt-1">
                아티스트 스페이스에서 사용할 역할을 선택하세요
              </p>
            </div>
            <div className="flex gap-2">
              {roles.length === 0 && (
                <Button
                  onClick={handleInitializeRoles}
                  disabled={initializing}
                  size="sm"
                  variant="outline"
                  className="gap-1"
                >
                  {initializing ? (
                    <>
                      <Plus className="h-4 w-4 animate-spin" />
                      초기화 중...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      역할 목록 초기화
                    </>
                  )}
                </Button>
              )}
              {roles.length > 0 && (
                <>
                  <Button
                    onClick={handleSelectAll}
                    size="sm"
                    variant="outline"
                  >
                    전체 선택
                  </Button>
                  <Button
                    onClick={handleDeselectAll}
                    size="sm"
                    variant="outline"
                  >
                    전체 해제
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    size="sm"
                    variant="default"
                  >
                    {saving ? "저장 중..." : "저장"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* 2단 레이아웃 */}
          {roles.length === 0 ? (
            <div className="rounded-md border p-8 text-center">
              <p className="text-muted-foreground mb-4">역할 목록이 없습니다</p>
              <Button
                onClick={handleInitializeRoles}
                disabled={initializing}
                variant="outline"
              >
                {initializing ? "초기화 중..." : "기본 역할 목록 초기화"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 h-[calc(100vh-250px)] min-h-0">
              {/* 메인 콘텐츠 영역 */}
              <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
                {/* 좌측: 카테고리 목록 */}
                <div className="w-64 flex-shrink-0 rounded-md border overflow-hidden flex flex-col">
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
                  <div className="bg-muted/50 px-4 py-3 border-b space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">
                        {selectedCategory === null ? '전체 역할' : selectedCategory}
                        {searchQuery && (
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            ({filteredRoles.length}개)
                          </span>
                        )}
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
                    {/* 직접 입력 카테고리 선택 시 역할 추가 버튼 */}
                    {selectedCategory === '직접 입력' && (
                      <div className="mb-4">
                        <Button
                          onClick={() => setIsAddRoleDialogOpen(true)}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          역할 추가
                        </Button>
                      </div>
                    )}
                    
                    {filteredRoles.length === 0 && searchQuery ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>검색 결과가 없습니다</p>
                        <p className="text-xs mt-1">다른 검색어를 시도해보세요</p>
                      </div>
                    ) : selectedCategory === null ? (
                      <div className="space-y-4">
                        {categories.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>역할이 없습니다</p>
                          </div>
                        ) : (
                          categories.map((category) => (
                            <div key={category} className="space-y-2">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {category}
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {(rolesByCategory[category] || []).map((role) => {
                                const isEnabled = localRoleStates[role.id] !== undefined 
                                  ? localRoleStates[role.id] 
                                  : role.is_enabled
                                const hasLocalChange = localRoleStates[role.id] !== undefined && 
                                  localRoleStates[role.id] !== role.is_enabled
                                
                                const isCustomRole = role.category === '직접 입력'
                                
                                return (
                                  <div
                                    key={role.id}
                                    className={`flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors ${
                                      hasLocalChange ? 'bg-primary/5 border border-primary/20' : ''
                                    }`}
                                  >
                                    <Checkbox
                                      checked={isEnabled}
                                      onCheckedChange={() => handleToggleRole(role.id)}
                                      disabled={!canManageRoles || saving}
                                      id={`role-${role.id}`}
                                    />
                                    <label
                                      htmlFor={`role-${role.id}`}
                                      className={`text-sm cursor-pointer flex-1 ${
                                        isEnabled ? 'font-medium' : 'text-muted-foreground'
                                      }`}
                                    >
                                      {role.role_name}
                                    </label>
                                    {isCustomRole && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteRole(role.id)
                                        }}
                                        disabled={deletingRoleId === role.id || saving}
                                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                        type="button"
                                        title="역할 삭제"
                                      >
                                        {deletingRoleId === role.id ? (
                                          <X className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-3 w-3" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {currentCategoryRoles.length === 0 ? (
                          <div className="col-span-full text-center py-8 text-muted-foreground">
                            {selectedCategory === '직접 입력' ? (
                              <>
                                <p className="mb-2">아직 추가된 역할이 없습니다</p>
                                <p className="text-xs">위의 &apos;역할 추가&apos; 버튼을 클릭하여 역할을 추가하세요</p>
                              </>
                            ) : (
                              <p>이 카테고리에 역할이 없습니다</p>
                            )}
                          </div>
                        ) : (
                          currentCategoryRoles.map((role) => {
                          const isEnabled = localRoleStates[role.id] !== undefined 
                            ? localRoleStates[role.id] 
                            : role.is_enabled
                          const hasLocalChange = localRoleStates[role.id] !== undefined && 
                            localRoleStates[role.id] !== role.is_enabled
                          
                          const isCustomRole = role.category === '직접 입력'
                          
                          return (
                            <div
                              key={role.id}
                              className={`flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors ${
                                hasLocalChange ? 'bg-primary/5 border border-primary/20' : ''
                              }`}
                            >
                              <Checkbox
                                checked={isEnabled}
                                onCheckedChange={() => handleToggleRole(role.id)}
                                disabled={!canManageRoles || saving}
                                id={`role-${role.id}`}
                              />
                              <label
                                htmlFor={`role-${role.id}`}
                                className={`text-sm cursor-pointer flex-1 ${
                                  isEnabled ? 'font-medium' : 'text-muted-foreground'
                                }`}
                              >
                                {role.role_name}
                              </label>
                              {isCustomRole && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteRole(role.id)
                                  }}
                                  disabled={deletingRoleId === role.id || saving}
                                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                  type="button"
                                  title="역할 삭제"
                                >
                                  {deletingRoleId === role.id ? (
                                    <X className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          )
                        }))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 하단: 선택된 역할 칩 */}
              {selectedRoles.length > 0 && (
                <div className="rounded-md border p-4 bg-muted/30 flex-shrink-0 max-h-48 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">
                      선택된 역할 ({selectedRoles.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoles.map((role) => (
                      <div
                        key={role.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background border text-sm"
                      >
                        <span className="font-medium">{role.role_name}</span>
                        <span className="text-xs text-muted-foreground">({role.category})</span>
                        <button
                          onClick={() => handleToggleRole(role.id)}
                          className="ml-1 hover:text-destructive transition-colors"
                          disabled={!canManageRoles || saving}
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 역할 추가 다이얼로그 */}
      <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>역할 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="role-name" className="text-sm font-medium">
                역할 이름
              </label>
              <Input
                id="role-name"
                type="text"
                placeholder="역할 이름을 입력하세요"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newRoleName.trim()) {
                    handleAddRole()
                  }
                }}
                disabled={isAddingRole}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddRoleDialogOpen(false)
                setNewRoleName("")
              }}
              disabled={isAddingRole}
            >
              취소
            </Button>
            <Button
              onClick={handleAddRole}
              disabled={!newRoleName.trim() || isAddingRole}
            >
              {isAddingRole ? "추가 중..." : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

