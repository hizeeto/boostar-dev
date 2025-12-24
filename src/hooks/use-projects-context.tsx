"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { Project, ProjectColor } from "./use-projects"
import { useArtistContext } from "./use-artist-context"
import { generateProjectCode } from "@/lib/utils"

interface ProjectsContextType {
  projects: Project[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  updateProject: (projectId: string, updates: Partial<Project>) => void
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { activeArtist } = useArtistContext()

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      
      // 아티스트가 선택되지 않았으면 빈 배열 반환
      if (!activeArtist) {
        setProjects([])
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('artist_id', activeArtist.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // 각 프로젝트의 실제 멤버 수 계산
      const projectsWithMemberCount = await Promise.all(
        (data || []).map(async (project) => {
          // 실제 project_members 테이블에서 멤버 수 조회
          const { count, error: countError } = await supabase
            .from('project_members')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
          
          // 실제 멤버 수로 업데이트 (오류가 있으면 기존 값 유지)
          const actualMemberCount = countError ? (project.member_count || 1) : (count || 0)
          
          // DB의 member_count와 실제 멤버 수가 다르면 업데이트
          if (actualMemberCount !== project.member_count && !countError) {
            await supabase
              .from('projects')
              .update({ member_count: actualMemberCount })
              .eq('id', project.id)
          }
          
          return { ...project, member_count: actualMemberCount }
        })
      )
      
      // 프로젝트 코드가 없는 프로젝트에 자동으로 코드 생성
      const projectsWithCodes = await Promise.all(
        projectsWithMemberCount.map(async (project) => {
          if (!project.project_code) {
            try {
              // 고유번호 생성 및 중복 확인
              let projectCode: string
              let attempts = 0
              const maxAttempts = 10
              
              do {
                projectCode = generateProjectCode()
                const { data: existing } = await supabase
                  .from('projects')
                  .select('id')
                  .eq('project_code', projectCode)
                  .single()
                
                if (!existing) {
                  break // 고유번호가 중복되지 않음
                }
                
                attempts++
                if (attempts >= maxAttempts) {
                  console.error("프로젝트 코드 생성 실패:", project.id)
                  return project // 코드 생성 실패 시 원본 반환
                }
              } while (true)
              
              // 프로젝트 코드 업데이트
              const { error: updateError } = await supabase
                .from('projects')
                .update({ project_code: projectCode })
                .eq('id', project.id)
              
              if (!updateError) {
                return { ...project, project_code: projectCode }
              } else {
                console.error("프로젝트 코드 업데이트 실패:", updateError)
                return project
              }
            } catch (err) {
              console.error("프로젝트 코드 생성 중 오류:", err)
              return project
            }
          }
          return project
        })
      )
      
      setProjects(projectsWithCodes)
    } catch (err) {
      console.error("프로젝트 로드 실패:", err)
      setError(err instanceof Error ? err : new Error("프로젝트를 불러올 수 없습니다"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [activeArtist?.id])

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, ...updates } : p))
    )
  }

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        loading,
        error,
        refetch: loadProjects,
        updateProject,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjectsContext() {
  const context = useContext(ProjectsContext)
  if (context === undefined) {
    throw new Error("useProjectsContext must be used within a ProjectsProvider")
  }
  return context
}

