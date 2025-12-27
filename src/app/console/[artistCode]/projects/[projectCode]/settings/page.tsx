"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useArtistContext } from "@/hooks/use-artist-context"
import { Project } from "@/hooks/use-projects"
import { ProjectNavTabs } from "@/components/project-nav-tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/toast"

// UUID 형식 검증 함수
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const artistContext = useArtistContext()
  const activeArtist = artistContext?.activeArtist
  const projectCode = params.projectCode as string
  const artistCode = params.artistCode as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const loadProject = useCallback(async () => {
    if (!activeArtist) {
      // 아티스트가 아직 로딩 중이면 기다림
      if (artistContext?.loading) {
        return
      }
      // 로딩이 완료되었지만 아티스트가 없는 경우에만 리다이렉트
      if (artistContext && !artistContext.loading && artistContext.artists.length === 0) {
        console.error("[설정] 활성 아티스트가 없습니다")
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
        console.error("[설정] 프로젝트 조회 오류:", error)
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
      setFormData({
        name: data.name || "",
        description: data.description || "",
      })
    } catch (err) {
      console.error("[설정] 프로젝트 로드 실패:", err)
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

  const handleSave = async () => {
    if (!project) return

    try {
      setSaving(true)
      const supabase = createClient()

      const { error } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          description: formData.description,
        })
        .eq('id', project.id)

      if (error) {
        throw error
      }

      toast.success("프로젝트 설정이 저장되었습니다")
      await loadProject()
    } catch (err: any) {
      console.error("설정 저장 실패:", err)
      toast.error(err.message || "설정 저장에 실패했습니다")
    } finally {
      setSaving(false)
    }
  }

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
      
      {/* 설정 컨텐츠 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">설정</h2>
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>

            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
                <CardDescription>
                  프로젝트의 기본 정보를 수정할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">프로젝트 이름</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="프로젝트 이름을 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="프로젝트 설명을 입력하세요"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 프로젝트 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>프로젝트 정보</CardTitle>
                <CardDescription>
                  프로젝트의 상세 정보를 확인할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>프로젝트 코드</Label>
                  <Input value={project.project_code || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>생성일</Label>
                  <Input
                    value={project.created_at ? new Date(project.created_at).toLocaleDateString('ko-KR') : ""}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>

            {/* 위험 구역 */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">위험 구역</CardTitle>
                <CardDescription>
                  이 작업은 되돌릴 수 없습니다. 신중하게 진행하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" disabled>
                  프로젝트 삭제
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

