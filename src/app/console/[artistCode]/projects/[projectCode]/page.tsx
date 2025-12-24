"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useArtistContext } from "@/hooks/use-artist-context"
import { Project } from "@/hooks/use-projects"
import { ProjectFeedList } from "@/components/project-feed-list"
import { ProjectSidebar } from "@/components/project-sidebar"
import { ProjectNavTabs } from "@/components/project-nav-tabs"
import { toast } from "@/lib/toast"

// UUID 형식 검증 함수
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const artistContext = useArtistContext()
  const activeArtist = artistContext?.activeArtist
  const projectCode = params.projectCode as string
  const artistCode = params.artistCode as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProject = useCallback(async () => {
    if (!activeArtist) {
      console.error("[프로젝트 상세] 활성 아티스트가 없습니다")
      if (artistContext && !artistContext.loading) {
        router.push(`/console/${artistCode}/projects`)
      }
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      console.log("[프로젝트 상세] 프로젝트 로드 시도:", { 
        projectCode, 
        artistId: activeArtist.id,
        artistCode: activeArtist.artist_code,
        isUUID: isValidUUID(projectCode)
      })

      // UUID 형식인지 확인하여 조건부로 쿼리 구성
      let query = supabase
        .from('projects')
        .select('*')
        .eq('artist_id', activeArtist.id)

      if (isValidUUID(projectCode)) {
        // UUID 형식이면 project_code 또는 id로 조회
        query = query.or(`project_code.eq.${projectCode},id.eq.${projectCode}`)
      } else {
        // UUID 형식이 아니면 project_code로만 조회
        query = query.eq('project_code', projectCode)
      }

      const { data, error } = await query.maybeSingle()

      console.log("[프로젝트 상세] 조회 결과:", { 
        found: !!data, 
        error: error?.message,
        errorCode: error?.code,
        projectCode: data?.project_code,
        projectName: data?.name,
        projectId: data?.id
      })

      if (error) {
        console.error("[프로젝트 상세] 프로젝트 조회 오류:", error)
        
        // 디버깅을 위해 해당 아티스트의 모든 프로젝트 조회
        const { data: allProjects } = await supabase
          .from('projects')
          .select('id, name, project_code, artist_id')
          .eq('artist_id', activeArtist.id)
        
        console.error("[프로젝트 상세] 해당 아티스트의 모든 프로젝트:", allProjects)
        
        // 오류 타입별 구체적인 메시지
        let errorMessage = "프로젝트를 불러오는 중 오류가 발생했습니다"
        if (error.code === 'PGRST301' || error.message?.includes('permission')) {
          errorMessage = "프로젝트를 불러올 권한이 없습니다"
        } else if (error.message) {
          errorMessage = `프로젝트를 불러오는 중 오류가 발생했습니다: ${error.message}`
        }
        
        toast.error(errorMessage)
        router.push(`/console/${artistCode}/projects`)
        return
      }

      if (!data) {
        console.error("[프로젝트 상세] 프로젝트를 찾을 수 없음:", { 
          projectCode, 
          artistId: activeArtist.id 
        })
        
        // 디버깅을 위해 해당 아티스트의 모든 프로젝트 조회
        const { data: allProjects } = await supabase
          .from('projects')
          .select('id, name, project_code, artist_id')
          .eq('artist_id', activeArtist.id)
        
        console.error("[프로젝트 상세] 해당 아티스트의 모든 프로젝트:", allProjects)
        
        toast.error("프로젝트를 찾을 수 없습니다")
        router.push(`/console/${artistCode}/projects`)
        return
      }

      console.log("[프로젝트 상세] 프로젝트 로드 성공:", {
        id: data.id,
        name: data.name,
        project_code: data.project_code
      })
      setProject(data as Project)
    } catch (err) {
      console.error("[프로젝트 상세] 프로젝트 로드 실패:", err)
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
      toast.error(`프로젝트를 불러오는 중 오류가 발생했습니다: ${errorMessage}`)
      router.push(`/console/${artistCode}/projects`)
    } finally {
      setLoading(false)
    }
  }, [activeArtist, projectCode, artistCode, router, artistContext])

  useEffect(() => {
    if (activeArtist) {
      loadProject()
    } else if (artistContext && !artistContext.loading) {
      // 아티스트가 로드되었지만 activeArtist가 없는 경우
      console.error("활성 아티스트가 없습니다")
      router.push(`/console/${artistCode}/projects`)
    }
  }, [projectCode, activeArtist?.id, artistContext?.loading, loadProject, artistCode, router])

  // 아티스트가 로딩 중이거나 없으면 로딩 표시
  if (!artistContext || artistContext.loading || !activeArtist || loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">프로젝트를 찾을 수 없습니다</p>
          <p className="text-sm text-muted-foreground mt-2">
            프로젝트 목록으로 돌아가는 중...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* 상단 네비게이션 탭 */}
      <ProjectNavTabs projectCode={projectCode} projectId={project.id} artistCode={artistCode} />
      
      {/* 메인 컨텐츠 영역 */}
      <div className="flex flex-1 gap-6 p-6 overflow-hidden">
        {/* 왼쪽: 피드 영역 */}
        <div className="flex-1 overflow-y-auto">
          <ProjectFeedList projectId={project.id} />
        </div>
        
        {/* 오른쪽: 사이드바 */}
        <div className="w-[320px] flex-shrink-0">
          <ProjectSidebar projectId={project.id} />
        </div>
      </div>
    </div>
  )
}

