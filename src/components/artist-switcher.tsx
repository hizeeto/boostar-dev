"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Folder, User, Music } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useArtistContext } from "@/hooks/use-artist-context"
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
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/heic']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

export function ArtistSwitcher() {
  const { isMobile } = useSidebar()
  const { artists, loading, activeArtist, setActiveArtist, createArtist } = useArtistContext()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isCreating, setIsCreating] = React.useState(false)
  const [newArtistName, setNewArtistName] = React.useState("")
  const [profileImage, setProfileImage] = React.useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = React.useState<string | null>(null)
  const [imageError, setImageError] = React.useState<string | null>(null)
  const [artistMemberCounts, setArtistMemberCounts] = React.useState<Record<string, number>>({})
  const router = useRouter()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 기본 아이콘 컴포넌트 (아이콘 URL이 없을 때 사용)
  // 기본 아티스트는 음표 아이콘, icon_url이 없는 일반 아티스트는 음표 아이콘, 그 외는 폴더 아이콘
  const getIconForArtist = (artist: typeof activeArtist) => {
    if (!artist) return Music
    // 기본 아티스트는 음표 아이콘
    if (artist.is_default) {
      return Music
    }
    // icon_url이 없으면 음표 아이콘
    if (!artist.icon_url) {
      return Music
    }
    // icon_url이 있는 일반 아티스트는 폴더 아이콘
    return Folder
  }

  // 기본 아티스트 이름 가져오기 (한국어 우선)
  const getArtistDisplayName = (artist: typeof activeArtist) => {
    if (!artist) return ""
    
    // names JSONB에서 한국어 우선 사용
    if (artist.names && typeof artist.names === 'object') {
      // 한국어가 있으면 한국어 사용
      if (artist.names.ko) {
        return artist.names.ko
      }
      // 한국어가 없으면 첫 번째 언어 사용
      const firstLang = Object.keys(artist.names)[0]
      if (firstLang && artist.names[firstLang]) {
        return artist.names[firstLang]
      }
    }
    
    // names가 없거나 비어있으면 기본 아티스트인 경우 "기본 아티스트" 반환
    if (artist.is_default) {
      return "기본 아티스트"
    }
    
    return ""
  }

  // 각 아티스트별 인원 수 계산
  React.useEffect(() => {
    const loadMemberCounts = async () => {
      if (artists.length === 0) return

      try {
        const supabase = createClient()
        const counts: Record<string, number> = {}

        // 각 아티스트별로 artist_members 테이블에서 멤버 수 조회
        for (const artist of artists) {
          const { data: members, error, count } = await supabase
            .from('artist_members')
            .select('id', { count: 'exact' })
            .eq('artist_id', artist.id)

          if (!error) {
            // count가 있으면 사용, 없으면 배열 길이 사용
            const memberCount = count !== null ? count : (members?.length || 0)
            counts[artist.id] = memberCount > 0 ? memberCount : 1
          } else {
            // 오류가 있으면 아티스트 소유자 본인 1명만
            counts[artist.id] = 1
          }
        }

        setArtistMemberCounts(counts)
      } catch (err) {
        console.error("인원 수 로드 실패:", err)
        // 오류 발생 시 기본값 설정
        const defaultCounts: Record<string, number> = {}
        artists.forEach(artist => {
          defaultCounts[artist.id] = 1
        })
        setArtistMemberCounts(defaultCounts)
      }
    }

    loadMemberCounts()
  }, [artists])

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Folder className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold">로딩 중...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!activeArtist && artists.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={() => setIsCreateDialogOpen(true)}
            className="ring-0 focus-visible:ring-0"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Plus className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold">아티스트 스페이스 추가</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!activeArtist) {
    return null
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 타입 확인
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("jpg, jpeg, png, webp, avif, heic 파일만 업로드 가능합니다.")
      return
    }

    // 파일 크기 확인
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("파일 크기는 5MB 이하여야 합니다.")
      return
    }

    setImageError(null)
    setProfileImage(file)
    
    // 미리보기 생성
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setProfileImage(null)
    setProfileImagePreview(null)
    setImageError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCreateArtist = async () => {
    if (!newArtistName.trim()) {
      toast.error("아티스트 이름을 입력해주세요")
      return
    }

    if (isCreating) return

    setIsCreating(true)
    try {
      const supabase = createClient()
      
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      let userId: string
      
      if (demoUser) {
        userId = DEMO_USER_ID
        console.log('[ArtistSwitcher] 데모 사용자 모드 - 아티스트 생성:', userId)
      } else {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          toast.error("로그인이 필요합니다")
          setIsCreating(false)
          return
        }
        
        userId = user.id
      }

      let iconUrl: string | undefined = undefined

      // 프로필 이미지 업로드
      if (profileImage) {
        try {
          const fileExt = profileImage.name.split('.').pop()
          const fileName = `artist-${userId}-${Date.now()}.${fileExt}`
          const filePath = `artist-images/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, profileImage, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            console.error('이미지 업로드 오류:', uploadError)
            
            // RLS 정책 오류인 경우 더 명확한 메시지 제공
            if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('RLS')) {
              throw new Error('이미지 업로드 권한이 없습니다. Supabase Storage 버킷의 RLS 정책을 확인해주세요.')
            }
            
            throw new Error(`이미지 업로드 실패: ${uploadError.message}`)
          }

          // 공개 URL 가져오기
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath)

          iconUrl = urlData.publicUrl
        } catch (imgError: any) {
          console.error('이미지 업로드 중 오류:', imgError)
          toast.error(imgError.message || "이미지 업로드에 실패했습니다")
          setIsCreating(false)
          return
        }
      }

      const newArtist = await createArtist({
        name: newArtistName.trim(),
        icon_url: iconUrl,
      })
      
      toast.success(`"${newArtistName.trim()}" 아티스트가 생성되었습니다.`)
      setIsCreateDialogOpen(false)
      setNewArtistName("")
      setProfileImage(null)
      setProfileImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      
      // 새 아티스트의 홈으로 이동
      if (newArtist?.artist_code) {
        router.push(`/console/${newArtist.artist_code}/home`)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error("아티스트 생성 실패:", err)
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      toast.error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  const handleArtistSelect = (artist: typeof activeArtist) => {
    if (!artist?.artist_code) return
    
    setActiveArtist(artist)
    
    // 현재 경로에서 artistCode 부분을 새로운 artistCode로 교체
    const currentPath = window.location.pathname
    const pathSegments = currentPath.split('/')
    
    // /console/[artistCode]/... 형식인 경우
    if (pathSegments[1] === 'console' && pathSegments[2]) {
      pathSegments[2] = artist.artist_code
      router.push(pathSegments.join('/'))
    } else {
      // 다른 형식이면 기본 홈으로 이동
      router.push(`/console/${artist.artist_code}/home`)
    }
  }

  // 활성 아티스트의 아이콘 컴포넌트
  const IconComponent = getIconForArtist(activeArtist)

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="ring-0 focus-visible:ring-0 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div 
                  className={cn(
                    "flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden",
                    !activeArtist.icon_url && (activeArtist.is_default 
                      ? "bg-sidebar-accent text-primary" 
                      : "text-sidebar-primary-foreground")
                  )}
                  style={!activeArtist.icon_url && !activeArtist.is_default ? { 
                    backgroundColor: activeArtist.color || undefined,
                    background: activeArtist.color 
                      ? activeArtist.color 
                      : 'var(--sidebar-primary)'
                  } : undefined}
                >
                  {activeArtist.icon_url ? (
                    <img 
                      src={activeArtist.icon_url} 
                      alt={getArtistDisplayName(activeArtist)}
                      className="w-full h-full object-cover border border-border/50"
                    />
                  ) : (
                    <IconComponent className="size-4" />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">
                    {getArtistDisplayName(activeArtist)}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{artistMemberCounts[activeArtist.id] || 0}명</span>
                  </div>
                </div>
                <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                아티스트 스페이스
              </DropdownMenuLabel>
              {artists.map((artist) => {
                const ArtistIcon = getIconForArtist(artist)
                const memberCount = artistMemberCounts[artist.id] || 0
                return (
                  <DropdownMenuItem
                    key={artist.id}
                    onClick={() => handleArtistSelect(artist)}
                    className="gap-2 p-2"
                  >
                    <div 
                      className={cn(
                        "flex size-6 items-center justify-center rounded-sm overflow-hidden",
                        !artist.icon_url && (artist.is_default 
                          ? "bg-sidebar-accent text-primary" 
                          : "border")
                      )}
                      style={!artist.icon_url && !artist.is_default ? { 
                        backgroundColor: artist.color || undefined,
                      } : undefined}
                    >
                      {artist.icon_url ? (
                        <img 
                          src={artist.icon_url} 
                          alt={getArtistDisplayName(artist)}
                          className="w-full h-full object-cover border border-border"
                        />
                      ) : (
                        <ArtistIcon className="size-4 shrink-0" />
                      )}
                    </div>
                    <span className="flex-1">{getArtistDisplayName(artist)}</span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{memberCount}명</span>
                    </div>
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="gap-2 p-2"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">아티스트 스페이스 추가</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* 아티스트 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새 아티스트 만들기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 프로필 이미지 추가 */}
            <Field>
              <FieldLabel>
                프로필 이미지{" "}
                <span className="text-xs text-muted-foreground font-normal">(선택)</span>
              </FieldLabel>
              <div className="flex gap-4 items-center">
                <div 
                  className="relative flex-shrink-0 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="프로필 미리보기"
                      className="w-24 h-24 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(",")}
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="text-sm text-muted-foreground">
                    이미지 파일(png, jpg 등) 업로드<br></br>
                    최대 5MB까지 가능
                  </div>
                  {imageError && <FieldError>{imageError}</FieldError>}
                  <div className="flex gap-1 mt-1">
                    {profileImage ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          변경
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={handleRemoveImage}
                        >
                          삭제
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        추가
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Field>

            {/* 아티스트 이름 */}
            <div className="space-y-2">
              <Label htmlFor="artist-name">아티스트 이름 *</Label>
              <Input
                id="artist-name"
                placeholder="아티스트 이름을 입력하세요"
                value={newArtistName}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= 30) {
                    setNewArtistName(value)
                  }
                }}
                maxLength={30}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setNewArtistName("")
                setProfileImage(null)
                setProfileImagePreview(null)
                setImageError(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""
                }
              }}
              disabled={isCreating}
            >
              취소
            </Button>
            <Button
              onClick={handleCreateArtist}
              disabled={!newArtistName.trim() || isCreating}
            >
              {isCreating ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

