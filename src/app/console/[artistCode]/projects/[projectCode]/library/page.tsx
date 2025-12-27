"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useArtistContext } from "@/hooks/use-artist-context"
import { Project } from "@/hooks/use-projects"
import { ProjectNavTabs } from "@/components/project-nav-tabs"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"
import { toast } from "@/lib/toast"

// UUID 형식 검증 함수
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export default function LibraryPage() {
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
      // 아티스트가 아직 로딩 중이면 기다림
      if (artistContext?.loading) {
        return
      }
      // 로딩이 완료되었지만 아티스트가 없는 경우에만 리다이렉트
      if (artistContext && !artistContext.loading && artistContext.artists.length === 0) {
        console.error("[라이브러리] 활성 아티스트가 없습니다")
        router.push(`/console/${artistCode}/projects`)
      }
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('projects')
        .select('*')
        .eq('artist_id', activeArtist.id)

      if (isValidUUID(projectCode)) {
        query = query.or(`project_code.eq.${projectCode},id.eq.${projectCode}`)
      } else {
        query = query.eq('project_code', projectCode)
      }

      const { data, error } = await query.maybeSingle()

      if (error) {
        console.error("[라이브러리] 프로젝트 조회 오류:", error)
        toast.error("프로젝트를 불러오는 중 오류가 발생했습니다")
        router.push(`/console/${artistCode}/projects`)
        return
      }

      if (!data) {
        toast.error("프로젝트를 찾을 수 없습니다")
        router.push(`/console/${artistCode}/projects`)
        return
      }

      setProject(data as Project)
    } catch (err) {
      console.error("[라이브러리] 프로젝트 로드 실패:", err)
      toast.error("프로젝트를 불러오는 중 오류가 발생했습니다")
      router.push(`/console/${artistCode}/projects`)
    } finally {
      setLoading(false)
    }
  }, [activeArtist, projectCode, artistCode, router, artistContext])

  useEffect(() => {
    if (activeArtist) {
      loadProject()
    } else if (artistContext && !artistContext.loading) {
      // 아티스트 목록이 비어있을 때만 리다이렉트
      if (artistContext.artists.length === 0) {
        router.push(`/console/${artistCode}/projects`)
      }
      // 아티스트 목록이 있으면 activeArtist가 설정될 때까지 기다림
    }
  }, [projectCode, activeArtist?.id, artistContext?.loading, artistContext?.artists.length, loadProject, artistCode, router, artistContext])

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
      <ProjectNavTabs
        projectCode={projectCode}
        projectId={project.id}
        artistCode={artistCode}
      />
      
      {/* 라이브러리 컨텐츠 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">라이브러리</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Upload className="h-4 w-4" />
                  파일 업로드
                </Button>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  폴더 추가
                </Button>
              </div>
            </div>

            {/* 파일 목록 */}
            <div className="rounded-md border p-6">
              <p className="text-muted-foreground text-center py-8">
                파일이 없습니다. 파일을 업로드하거나 폴더를 추가해보세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

