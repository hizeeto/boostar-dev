"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { useArtistContext } from "@/hooks/use-artist-context"
import { createClient } from "@/lib/supabase/client"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"

// 권한 레벨 타입
type PermissionLevel = "소유자" | "관리자" | "멤버"

// 권한 기능 타입
type PermissionFeature = 
  | "프로젝트_생성"
  | "프로젝트_편집"
  | "프로젝트_삭제"
  | "멤버_초대"
  | "멤버_제거"
  | "역할_관리"
  | "권한_관리"
  | "프로필_편집"

// 권한 기능 설명
const PERMISSION_FEATURES: Record<PermissionFeature, string> = {
  프로젝트_생성: "프로젝트 생성",
  프로젝트_편집: "프로젝트 편집",
  프로젝트_삭제: "프로젝트 삭제",
  멤버_초대: "멤버 초대",
  멤버_제거: "멤버 제거",
  역할_관리: "역할 관리",
  권한_관리: "권한 관리",
  프로필_편집: "프로필 편집",
}

// 기본 권한 설정
const DEFAULT_PERMISSION_SETTINGS: Record<string, Record<string, boolean>> = {
  관리자: {
    프로젝트_생성: true,
    프로젝트_편집: true,
    프로젝트_삭제: false,
    멤버_초대: true,
    멤버_제거: false,
    역할_관리: true,
    권한_관리: false,
    프로필_편집: true,
  },
  멤버: {
    프로젝트_생성: false,
    프로젝트_편집: false,
    프로젝트_삭제: false,
    멤버_초대: false,
    멤버_제거: false,
    역할_관리: false,
    권한_관리: false,
    프로필_편집: false,
  },
}

export function ArtistPermissionTab() {
  const params = useParams()
  const { artists, loading: artistsLoading, activeArtist, updateArtist, refetch } = useArtistContext()
  const artistCode = params.artistCode as string
  
  // 현재 아티스트 찾기
  const currentArtist = artists.find((a) => a.artist_code === artistCode) || activeArtist

  // 권한 설정 상태
  const [permissionSettings, setPermissionSettings] = useState<Record<string, Record<string, boolean>>>(DEFAULT_PERMISSION_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // 현재 사용자 ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const getCurrentUser = async () => {
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      
      if (demoUser) {
        console.log('[ArtistPermissionTab] 데모 사용자 모드:', DEMO_USER_ID)
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

  // 아티스트의 권한 설정 로드
  useEffect(() => {
    if (currentArtist?.permission_settings) {
      setPermissionSettings(currentArtist.permission_settings)
    } else {
      setPermissionSettings(DEFAULT_PERMISSION_SETTINGS)
    }
  }, [currentArtist?.permission_settings])

  // 변경사항 확인
  useEffect(() => {
    if (!currentArtist) {
      setHasChanges(false)
      return
    }

    const currentSettings = currentArtist.permission_settings || DEFAULT_PERMISSION_SETTINGS
    const hasDiff = JSON.stringify(permissionSettings) !== JSON.stringify(currentSettings)
    setHasChanges(hasDiff)
  }, [permissionSettings, currentArtist])

  // 권한 체크박스 토글
  const handleTogglePermission = (level: "관리자" | "멤버", feature: PermissionFeature) => {
    if (!isCurrentUserOwner) {
      toast.error("소유자만 권한을 변경할 수 있습니다")
      return
    }

    setPermissionSettings(prev => ({
      ...prev,
      [level]: {
        ...prev[level],
        [feature]: !prev[level][feature],
      },
    }))
  }

  // 권한 설정 저장
  const handleSave = async () => {
    if (!currentArtist || !isCurrentUserOwner) {
      toast.error("소유자만 권한을 변경할 수 있습니다")
      return
    }

    try {
      setSaving(true)
      await updateArtist(currentArtist.id, {
        permission_settings: permissionSettings,
      })
      await refetch()
      toast.success("권한 설정이 저장되었습니다")
    } catch (err: any) {
      console.error("권한 설정 저장 실패:", err)
      toast.error(err.message || "권한 설정 저장에 실패했습니다")
    } finally {
      setSaving(false)
    }
  }

  // 초기화
  const handleReset = () => {
    if (!confirm("권한 설정을 기본값으로 초기화하시겠습니까?")) {
      return
    }
    setPermissionSettings(DEFAULT_PERMISSION_SETTINGS)
  }

  if (artistsLoading) {
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
              <h2 className="text-2xl font-semibold">권한</h2>
              <p className="text-sm text-muted-foreground mt-1">
                각 권한 레벨별로 허용되는 기능을 비교할 수 있습니다. 소유자는 모든 권한을 가지고 있으며 변경할 수 없습니다.
              </p>
            </div>
            <div className="flex gap-2">
              {hasChanges && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  disabled={saving || !isCurrentUserOwner}
                >
                  초기화
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving || !isCurrentUserOwner}
                size="sm"
              >
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>

          {/* 안내 메시지 */}
          {!isCurrentUserOwner && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                소유자만 권한 설정을 변경할 수 있습니다.
              </p>
            </div>
          )}

          {/* 권한 비교 테이블 */}
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm w-[200px]">
                      기능
                    </th>
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground text-sm min-w-[120px]">
                      소유자
                    </th>
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground text-sm min-w-[120px]">
                      관리자
                    </th>
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground text-sm min-w-[120px]">
                      멤버
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(PERMISSION_FEATURES).map(([key, label], index) => {
                    const feature = key as PermissionFeature
                    const adminChecked = permissionSettings.관리자?.[feature] ?? false
                    const memberChecked = permissionSettings.멤버?.[feature] ?? false
                    
                    return (
                      <tr
                        key={key}
                        className={`border-b transition-colors hover:bg-muted/50 ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        }`}
                      >
                        <td className="p-4 align-middle">
                          <span className="text-sm font-medium">{label}</span>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={true}
                              disabled={true}
                              id={`owner-${key}`}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={adminChecked}
                              onCheckedChange={() => handleTogglePermission("관리자", feature)}
                              disabled={!isCurrentUserOwner || saving}
                              id={`admin-${key}`}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={memberChecked}
                              onCheckedChange={() => handleTogglePermission("멤버", feature)}
                              disabled={!isCurrentUserOwner || saving}
                              id={`member-${key}`}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
