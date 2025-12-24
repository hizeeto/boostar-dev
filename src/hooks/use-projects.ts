import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export type ProjectColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'gray' | 'black'

export interface Project {
  id: string
  name: string
  description: string | null
  start_date: string | null
  target_date: string | null
  member_count: number
  created_at: string
  updated_at: string
  owner_id: string
  artist_id: string | null
  is_archived?: boolean
  color?: ProjectColor
  is_pinned?: boolean
  project_code?: string
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error("프로젝트 로드 실패:", err)
      setError(err instanceof Error ? err : new Error("프로젝트를 불러올 수 없습니다"))
    } finally {
      setLoading(false)
    }
  }

  // 프로젝트 업데이트 함수
  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, ...updates } : p))
    )
  }

  return { projects, loading, error, refetch: loadProjects, updateProject }
}

