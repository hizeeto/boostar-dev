"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MoreHorizontal } from "lucide-react"
import { type ProjectColor } from "@/hooks/use-projects"
import { createClient } from "@/lib/supabase/client"
import { useProjectsContext } from "@/hooks/use-projects-context"
import { toast } from "@/lib/toast"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// 프로젝트 색상 정의
const PROJECT_COLORS: { value: ProjectColor; bgClass: string }[] = [
  { value: 'red', bgClass: 'bg-red-500' },
  { value: 'orange', bgClass: 'bg-orange-500' },
  { value: 'yellow', bgClass: 'bg-yellow-500' },
  { value: 'green', bgClass: 'bg-green-500' },
  { value: 'blue', bgClass: 'bg-blue-500' },
  { value: 'indigo', bgClass: 'bg-indigo-500' },
  { value: 'purple', bgClass: 'bg-primary' },
  { value: 'gray', bgClass: 'bg-gray-500' },
  { value: 'black', bgClass: 'bg-black' },
]

// 프로젝트 색상 클래스 가져오기
const getProjectColorClass = (color?: ProjectColor) => {
  if (!color) return 'bg-primary'
  const colorConfig = PROJECT_COLORS.find(c => c.value === color)
  return colorConfig?.bgClass || 'bg-primary'
}

export function NavProjects({
  projects,
}: {
  projects: {
    id: string
    name: string
    url: string
    color: ProjectColor
  }[]
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { updateProject, refetch } = useProjectsContext()
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>프로젝트 바로가기</SidebarGroupLabel>
      <div className="absolute right-3 top-3.5 flex items-center gap-1">
        <SidebarGroupAction
          onClick={() => {
            router.push("/console/projects")
          }}
          aria-label="더 보기"
          className="relative right-0 top-0"
        >
          <span
            className="w-4 h-4 inline-block"
            style={{
              WebkitMaskImage: "url(/assets/more_horiz.svg)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskImage: "url(/assets/more_horiz.svg)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              backgroundColor: "currentColor",
            }}
          />
        </SidebarGroupAction>
        <SidebarGroupAction
          onClick={() => {
            // 프로젝트 추가 로직을 여기에 구현
            console.log("프로젝트 추가")
          }}
          aria-label="프로젝트 추가"
          className="relative right-0 top-0"
        >
          <span
            className="w-4 h-4 inline-block"
            style={{
              WebkitMaskImage: "url(/assets/add.svg)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskImage: "url(/assets/add.svg)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              backgroundColor: "currentColor",
            }}
          />
        </SidebarGroupAction>
      </div>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild className="ring-0 focus-visible:ring-0">
              <Link 
                href={item.url}
                onClick={(e) => {
                  console.log("[사이드바 프로젝트 클릭] 프로젝트:", {
                    id: item.id,
                    name: item.name,
                    url: item.url,
                    color: item.color
                  })
                }}
              >
                <div className={`w-3 h-3 rounded-full ${getProjectColorClass(item.color)} flex-shrink-0`} />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover className="ring-0 focus-visible:ring-0">
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem onClick={() => router.push(item.url)}>
                  보기
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      // 로컬 상태 즉시 업데이트 (optimistic update)
                      updateProject(item.id, { is_pinned: false })
                      
                      const supabase = createClient()
                      const { error } = await supabase
                        .from('projects')
                        .update({ is_pinned: false })
                        .eq('id', item.id)

                      if (error) throw error

                      toast.success("바로가기 고정이 해제되었습니다")
                      
                      // 데이터베이스와 동기화를 위해 refetch
                      refetch()
                    } catch (err) {
                      console.error("프로젝트 고정 해제 실패:", err)
                      toast.error("고정 해제에 실패했습니다")
                      // 실패 시 원래 상태로 복원
                      updateProject(item.id, { is_pinned: true })
                      await refetch()
                    }
                  }}
                >
                  고정 해제
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeletingProjectId(item.id)}
                >
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      {/* 프로젝트 삭제 확인 다이얼로그 */}
      <Dialog open={deletingProjectId !== null} onOpenChange={(open) => !open && setDeletingProjectId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>프로젝트 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingProjectId(null)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deletingProjectId) return

                if (isDeleting) {
                  return // 이미 삭제 중이면 중복 요청 방지
                }

                setIsDeleting(true)

                try {
                  const supabase = createClient()
                  
                  // 데모 사용자 확인
                  const demoUser = getDemoUser()
                  let userId: string
                  
                  if (demoUser) {
                    userId = DEMO_USER_ID
                    console.log('[NavProjects] 데모 사용자 모드 - 프로젝트 삭제:', userId)
                  } else {
                    // 사용자 인증 확인
                    const { data: { user }, error: authError } = await supabase.auth.getUser()
                    
                    if (authError) {
                      throw new Error(`인증 오류: ${authError.message}`)
                    }
                    
                    if (!user) {
                      throw new Error("로그인이 필요합니다. 다시 로그인해주세요.")
                    }
                    
                    userId = user.id
                  }

                  // 삭제할 프로젝트 이름 가져오기 (토스트 메시지용)
                  const projectToDelete = projects.find(p => p.id === deletingProjectId)
                  const projectName = projectToDelete?.name || "프로젝트"

                  // 프로젝트 삭제
                  const { error } = await supabase
                    .from('projects')
                    .delete()
                    .eq('id', deletingProjectId)

                  if (error) {
                    console.error("프로젝트 삭제 오류:", error)
                    
                    // 에러 타입별 메시지
                    if (error.code === '42501') {
                      throw new Error("권한이 없습니다. RLS 정책을 확인해주세요.")
                    } else {
                      throw new Error(error.message || "프로젝트 삭제에 실패했습니다.")
                    }
                  }

                  // 성공 메시지
                  toast.success(`"${projectName}" 프로젝트가 삭제되었습니다.`)

                  // 다이얼로그 닫기
                  setDeletingProjectId(null)
                  
                  // 프로젝트 목록 새로고침
                  await refetch()
                  
                } catch (err) {
                  console.error("프로젝트 삭제 실패:", err)
                  const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
                  toast.error(errorMessage)
                } finally {
                  setIsDeleting(false)
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarGroup>
  )
}
