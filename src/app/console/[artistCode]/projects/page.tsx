"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { type Project, type ProjectColor } from "@/hooks/use-projects"
import { useProjectsContext } from "@/hooks/use-projects-context"
import { useArtistContext } from "@/hooks/use-artist-context"
import { createClient } from "@/lib/supabase/client"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { 
  Search, 
  Plus, 
  List, 
  Grid3x3,
  Folder,
  MoreVertical,
  Calendar as CalendarIcon,
  User,
  Pin,
  PinOff
} from "lucide-react"
import { cn, generateProjectCode } from "@/lib/utils"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { toast } from "@/lib/toast"

type ViewMode = "grid" | "list"
type TabType = "active" | "archived"

// 프로젝트 색상 정의
const PROJECT_COLORS: { value: ProjectColor; label: string; bgClass: string }[] = [
  { value: 'red', label: '빨강', bgClass: 'bg-red-500' },
  { value: 'orange', label: '주황', bgClass: 'bg-orange-500' },
  { value: 'yellow', label: '노랑', bgClass: 'bg-yellow-500' },
  { value: 'green', label: '초록', bgClass: 'bg-green-500' },
  { value: 'blue', label: '파랑', bgClass: 'bg-blue-500' },
  { value: 'indigo', label: '남색', bgClass: 'bg-indigo-500' },
  { value: 'purple', label: '보라', bgClass: 'bg-primary' },
  { value: 'gray', label: '회색', bgClass: 'bg-gray-500' },
  { value: 'black', label: '검정', bgClass: 'bg-black' },
]


export default function ProjectsPage() {
  const router = useRouter()
  const params = useParams()
  const artistCode = params.artistCode as string
  const { projects, loading, refetch, updateProject } = useProjectsContext()
  const { activeArtist } = useArtistContext()
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [activeTab, setActiveTab] = useState<TabType>("active")
  const [archivedProjects, setArchivedProjects] = useState<Set<string>>(new Set())
  
  // 새 프로젝트 생성 팝오버 상태
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    startDate: undefined as Date | undefined,
    targetDate: undefined as Date | undefined,
    color: 'purple' as ProjectColor,
  })

  // 프로젝트 편집 상태
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editProject, setEditProject] = useState({
    name: "",
    description: "",
    startDate: undefined as Date | undefined,
    targetDate: undefined as Date | undefined,
    color: 'purple' as ProjectColor,
  })

  // 프로젝트 삭제 상태
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    // 초기 보관 상태 설정
    const initialArchived = new Set<string>()
    projects.forEach((project) => {
      if (project.is_archived) {
        initialArchived.add(project.id)
      }
    })
    setArchivedProjects(initialArchived)
    filterProjects()
  }, [projects])

  useEffect(() => {
    filterProjects()
  }, [searchQuery, activeTab, archivedProjects])

  const filterProjects = () => {
    let filtered = [...projects]

    // 탭 필터 (활성/보관)
    if (activeTab === "archived") {
      filtered = filtered.filter((project) => archivedProjects.has(project.id) || project.is_archived)
    } else {
      filtered = filtered.filter((project) => !archivedProjects.has(project.id) && !project.is_archived)
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query)
      )
    }

    setFilteredProjects(filtered)
  }

  // 활성/보관 프로젝트 개수 계산
  const activeCount = projects.filter((p) => !archivedProjects.has(p.id) && !p.is_archived).length
  const archivedCount = projects.filter((p) => archivedProjects.has(p.id) || p.is_archived).length

  // 프로젝트 보관 처리
  const handleArchiveProject = async (projectId: string, archive: boolean) => {
    const newArchived = new Set(archivedProjects)
    if (archive) {
      newArchived.add(projectId)
    } else {
      newArchived.delete(projectId)
    }
    setArchivedProjects(newArchived)

    // 데이터베이스 업데이트
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projects')
        .update({ is_archived: archive })
        .eq('id', projectId)

      if (error) throw error
    } catch (err) {
      console.error("프로젝트 보관 처리 실패:", err)
      // 에러 발생 시 이전 상태로 복원
      setArchivedProjects(archivedProjects)
      toast.error("보관 처리에 실패했습니다")
    }
  }

  // 프로젝트 고정/해제 처리
  const handlePinProject = async (projectId: string, pin: boolean) => {
    // 로컬 상태 즉시 업데이트 (optimistic update)
    updateProject(projectId, { is_pinned: pin })
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projects')
        .update({ is_pinned: pin })
        .eq('id', projectId)

      if (error) throw error

      toast.success(pin ? "바로가기에 고정되었습니다" : "바로가기 고정이 해제되었습니다")
      
      // 데이터베이스와 동기화를 위해 refetch (백그라운드에서)
      refetch()
    } catch (err) {
      console.error("프로젝트 고정 처리 실패:", err)
      toast.error("고정 처리에 실패했습니다")
      // 실패 시 원래 상태로 복원
      updateProject(projectId, { is_pinned: !pin })
      // 데이터베이스 상태로 동기화
      await refetch()
    }
  }


  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // 프로젝트 색상 클래스 가져오기
  const getProjectColorClass = (color?: ProjectColor) => {
    if (!color) return 'bg-primary'
    const colorConfig = PROJECT_COLORS.find(c => c.value === color)
    return colorConfig?.bgClass || 'bg-primary'
  }

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error("프로젝트 제목을 입력해주세요")
      return
    }

    if (isCreating) {
      return // 이미 생성 중이면 중복 요청 방지
    }

    setIsCreating(true)

    try {
      const supabase = createClient()
      
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      let userId: string
      
      if (demoUser) {
        userId = DEMO_USER_ID
        console.log('[ProjectsPage] 데모 사용자 모드 - 프로젝트 생성:', userId)
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
          throw new Error("고유번호 생성에 실패했습니다. 다시 시도해주세요.")
        }
      } while (true)

      // 아티스트 확인
      if (!activeArtist) {
        throw new Error("아티스트를 선택해주세요")
      }

      // 프로젝트 생성
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProject.name.trim(),
          description: newProject.description.trim() || null,
          owner_id: userId,
          artist_id: activeArtist.id,
          start_date: newProject.startDate ? format(newProject.startDate, "yyyy-MM-dd") : null,
          target_date: newProject.targetDate ? format(newProject.targetDate, "yyyy-MM-dd") : null,
          member_count: 1, // 기본값: 소유자 1명
          color: newProject.color,
          project_code: projectCode,
        })
        .select()

      if (error) {
        console.error("프로젝트 생성 오류:", error)
        
        // 에러 타입별 메시지
        if (error.code === 'PGRST116') {
          throw new Error("프로젝트 테이블이 존재하지 않습니다. 데이터베이스 마이그레이션을 실행해주세요.")
        } else if (error.code === '23505') {
          throw new Error("이미 존재하는 프로젝트입니다.")
        } else if (error.code === '42501') {
          throw new Error("권한이 없습니다. RLS 정책을 확인해주세요.")
        } else {
          throw new Error(error.message || "프로젝트 생성에 실패했습니다.")
        }
      }

      if (!data || data.length === 0) {
        throw new Error("프로젝트가 생성되었지만 데이터를 가져올 수 없습니다.")
      }

      // 성공 메시지
      toast.success(`"${newProject.name.trim()}" 프로젝트가 생성되었습니다.`)

      // 폼 초기화
      setNewProject({
        name: "",
        description: "",
        startDate: undefined,
        targetDate: undefined,
        color: 'purple',
      })
      setIsCreateOpen(false)
      
      // 프로젝트 목록 새로고침
      await refetch()
      
    } catch (err) {
      console.error("프로젝트 생성 실패:", err)
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      toast.error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProjectId(project.id)
      setEditProject({
        name: project.name,
        description: project.description || "",
        startDate: project.start_date ? new Date(project.start_date) : undefined,
        targetDate: project.target_date ? new Date(project.target_date) : undefined,
        color: project.color || 'purple',
      })
  }

  const handleUpdateProject = async () => {
    if (!editingProjectId) return

    if (!editProject.name.trim()) {
      toast.error("프로젝트 제목을 입력해주세요")
      return
    }

    if (isEditing) {
      return // 이미 수정 중이면 중복 요청 방지
    }

    setIsEditing(true)

    try {
      const supabase = createClient()
      
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      let userId: string
      
      if (demoUser) {
        userId = DEMO_USER_ID
        console.log('[ProjectsPage] 데모 사용자 모드 - 프로젝트 수정:', userId)
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

      // 프로젝트 업데이트
      const { error } = await supabase
        .from('projects')
        .update({
          name: editProject.name.trim(),
          description: editProject.description.trim() || null,
          start_date: editProject.startDate ? format(editProject.startDate, "yyyy-MM-dd") : null,
          target_date: editProject.targetDate ? format(editProject.targetDate, "yyyy-MM-dd") : null,
          color: editProject.color,
        })
        .eq('id', editingProjectId)

      if (error) {
        console.error("프로젝트 수정 오류:", error)
        
        // 에러 타입별 메시지
        if (error.code === '42501') {
          throw new Error("권한이 없습니다. RLS 정책을 확인해주세요.")
        } else {
          throw new Error(error.message || "프로젝트 수정에 실패했습니다.")
        }
      }

      // 성공 메시지
      toast.success(`"${editProject.name.trim()}" 프로젝트가 수정되었습니다.`)

      // 폼 초기화
      setEditingProjectId(null)
      setEditProject({
        name: "",
        description: "",
        startDate: undefined,
        targetDate: undefined,
        color: 'purple',
      })
      
      // 프로젝트 목록 새로고침
      await refetch()
      
    } catch (err) {
      console.error("프로젝트 수정 실패:", err)
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      toast.error(errorMessage)
    } finally {
      setIsEditing(false)
    }
  }

  // 프로젝트 삭제 핸들러
  const handleDeleteProject = async () => {
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
        console.log('[ProjectsPage] 데모 사용자 모드 - 프로젝트 삭제:', userId)
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
  }

  // 아티스트가 없으면 안내 메시지 표시
  if (!activeArtist) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <Folder className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <p className="text-lg font-medium">아티스트를 선택해주세요</p>
          <p className="text-sm text-muted-foreground mt-1">
            사이드바에서 아티스트를 선택하거나 새로 생성해주세요
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* 헤더: 탭 메뉴 및 검색/필터 */}
      <div className="flex items-center justify-between">
        {/* 탭 메뉴 */}
        <div className="flex items-center border rounded-md overflow-hidden">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "active"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            활성
            {activeCount > 0 && (
              <Badge 
                variant="secondary" 
                className={`h-5 min-w-5 px-1.5 text-xs ${
                  activeTab === "active" 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : ""
                }`}
              >
                {activeCount}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "archived"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            보관
            {archivedCount > 0 && (
              <Badge 
                variant="secondary" 
                className={`h-5 min-w-5 px-1.5 text-xs ${
                  activeTab === "archived" 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : ""
                }`}
              >
                {archivedCount}
              </Badge>
            )}
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex items-center gap-2">
          {/* 검색 */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="프로젝트 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>


          {/* 뷰 모드 토글 */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* 새 프로젝트 추가 */}
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-0" />
            새 프로젝트
          </Button>
        </div>
      </div>

      {/* 새 프로젝트 생성 모달 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>새 프로젝트 만들기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 프로젝트 제목 */}
            <div className="space-y-2">
              <Label htmlFor="project-name">프로젝트 제목 *</Label>
              <div className="relative">
                <Input
                  id="project-name"
                  placeholder="프로젝트 제목을 입력하세요"
                  value={newProject.name}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 30) {
                      setNewProject({ ...newProject, name: value })
                    }
                  }}
                  maxLength={30}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  {newProject.name.length}/30
                </span>
              </div>
            </div>

            {/* 프로젝트 설명 */}
            <div className="space-y-2">
              <Label htmlFor="project-description">프로젝트 설명</Label>
              <div className="relative">
                <Textarea
                  id="project-description"
                  placeholder="프로젝트 설명을 입력하세요"
                  value={newProject.description}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 100) {
                      setNewProject({ ...newProject, description: value })
                    }
                  }}
                  maxLength={100}
                  rows={3}
                  className="pr-12 pb-6"
                />
                <span className="absolute right-3 bottom-2 text-xs text-muted-foreground pointer-events-none">
                  {newProject.description.length}/100
                </span>
              </div>
            </div>

            {/* 시작일 */}
            <div className="space-y-2">
              <Label>시작일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newProject.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newProject.startDate ? (
                      format(newProject.startDate, "yyyy년 MM월 dd일", { locale: ko })
                    ) : (
                      <span>시작일을 선택하세요</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]" align="start">
                  <Calendar
                    mode="single"
                    selected={newProject.startDate}
                    onSelect={(date) => setNewProject({ ...newProject, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 목표일 */}
            <div className="space-y-2">
              <Label>목표일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newProject.targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newProject.targetDate ? (
                      format(newProject.targetDate, "yyyy년 MM월 dd일", { locale: ko })
                    ) : (
                      <span>목표일을 선택하세요</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]" align="start">
                  <Calendar
                    mode="single"
                    selected={newProject.targetDate}
                    onSelect={(date) => setNewProject({ ...newProject, targetDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 색상 선택 */}
            <div className="space-y-2">
              <Label>색상</Label>
              <div className="flex flex-wrap gap-2.5">
                {PROJECT_COLORS.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setNewProject({ ...newProject, color: colorOption.value })}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all duration-200",
                      colorOption.bgClass,
                      newProject.color === colorOption.value
                        ? "border-primary scale-110 shadow-md"
                        : "border-border/50 hover:border-primary/60 hover:scale-105 hover:shadow-sm"
                    )}
                    title={colorOption.label}
                  />
                ))}
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={isCreating}
            >
              취소
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProject.name.trim() || isCreating}
            >
              {isCreating ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 프로젝트 편집 모달 */}
      <Dialog open={editingProjectId !== null} onOpenChange={(open) => !open && setEditingProjectId(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>프로젝트 편집</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 프로젝트 제목 */}
            <div className="space-y-2">
              <Label htmlFor="edit-project-name">프로젝트 제목 *</Label>
              <div className="relative">
                <Input
                  id="edit-project-name"
                  placeholder="프로젝트 제목을 입력하세요"
                  value={editProject.name}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 30) {
                      setEditProject({ ...editProject, name: value })
                    }
                  }}
                  maxLength={30}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  {editProject.name.length}/30
                </span>
              </div>
            </div>

            {/* 프로젝트 설명 */}
            <div className="space-y-2">
              <Label htmlFor="edit-project-description">프로젝트 설명</Label>
              <div className="relative">
                <Textarea
                  id="edit-project-description"
                  placeholder="프로젝트 설명을 입력하세요"
                  value={editProject.description}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 100) {
                      setEditProject({ ...editProject, description: value })
                    }
                  }}
                  maxLength={100}
                  rows={3}
                  className="pr-12 pb-6"
                />
                <span className="absolute right-3 bottom-2 text-xs text-muted-foreground pointer-events-none">
                  {editProject.description.length}/100
                </span>
              </div>
            </div>

            {/* 시작일 */}
            <div className="space-y-2">
              <Label>시작일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editProject.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editProject.startDate ? (
                      format(editProject.startDate, "yyyy년 MM월 dd일", { locale: ko })
                    ) : (
                      <span>시작일을 선택하세요</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]" align="start">
                  <Calendar
                    mode="single"
                    selected={editProject.startDate}
                    onSelect={(date) => setEditProject({ ...editProject, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 목표일 */}
            <div className="space-y-2">
              <Label>목표일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editProject.targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editProject.targetDate ? (
                      format(editProject.targetDate, "yyyy년 MM월 dd일", { locale: ko })
                    ) : (
                      <span>목표일을 선택하세요</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]" align="start">
                  <Calendar
                    mode="single"
                    selected={editProject.targetDate}
                    onSelect={(date) => setEditProject({ ...editProject, targetDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 색상 선택 */}
            <div className="space-y-2">
              <Label>색상</Label>
              <div className="flex flex-wrap gap-2.5">
                {PROJECT_COLORS.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setEditProject({ ...editProject, color: colorOption.value })}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all duration-200",
                      colorOption.bgClass,
                      editProject.color === colorOption.value
                        ? "border-primary scale-110 shadow-md"
                        : "border-border/50 hover:border-primary/60 hover:scale-105 hover:shadow-sm"
                    )}
                    title={colorOption.label}
                  />
                ))}
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingProjectId(null)}
              disabled={isEditing}
            >
              취소
            </Button>
            <Button
              onClick={handleUpdateProject}
              disabled={!editProject.name.trim() || isEditing}
            >
              {isEditing ? "수정 중..." : "수정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 프로젝트 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Folder className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <p className="text-lg font-medium">프로젝트가 없습니다</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? "검색 결과가 없습니다" : "새 프로젝트를 만들어보세요"}
            </p>
          </div>
          {!searchQuery && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-0" />
              새 프로젝트 만들기
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={async (e) => {
                e.preventDefault()
                console.log("[프로젝트 클릭] 프로젝트:", {
                  id: project.id,
                  name: project.name,
                  project_code: project.project_code,
                  artistCode
                })
                
                let codeToUse = project.project_code
                
                // 프로젝트 코드가 없으면 생성
                if (!codeToUse) {
                  console.log("[프로젝트 클릭] 프로젝트 코드가 없음, 생성 시작")
                  try {
                    const supabase = createClient()
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
                        break
                      }
                      
                      attempts++
                      if (attempts >= maxAttempts) {
                        toast.error("프로젝트 코드 생성에 실패했습니다")
                        return
                      }
                    } while (true)
                    
                    console.log("[프로젝트 클릭] 생성된 프로젝트 코드:", projectCode)
                    
                    // 프로젝트 코드 업데이트
                    const { error: updateError } = await supabase
                      .from('projects')
                      .update({ project_code: projectCode })
                      .eq('id', project.id)
                    
                    if (updateError) {
                      console.error("프로젝트 코드 업데이트 실패:", updateError)
                      toast.error("프로젝트 코드 생성에 실패했습니다")
                      return
                    }
                    
                    codeToUse = projectCode
                    // 로컬 상태 업데이트
                    updateProject(project.id, { project_code: projectCode })
                  } catch (err) {
                    console.error("프로젝트 코드 생성 중 오류:", err)
                    toast.error("프로젝트 코드 생성에 실패했습니다")
                    return
                  }
                }
                
                const targetUrl = `/console/${artistCode}/projects/${codeToUse}`
                console.log("[프로젝트 클릭] 이동할 URL:", targetUrl)
                router.push(targetUrl)
              }}
            >
              <CardHeader className="p-4 pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-3 h-3 rounded-full ${getProjectColorClass(project.color)} flex-shrink-0`} />
                    <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {project.is_pinned && (
                      <Pin className="h-4 w-4 text-muted-foreground" />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        handleEditProject(project)
                      }}>편집</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePinProject(project.id, !project.is_pinned)
                        }}
                      >
                        {project.is_pinned ? "바로가기 고정 해제" : "바로가기 고정"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleArchiveProject(project.id, activeTab === "active")
                        }}
                      >
                        {activeTab === "active" ? "보관" : "보관 해제"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingProjectId(project.id)
                        }}
                      >
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {project.description && (
                  <CardDescription className="line-clamp-2 mt-1">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <Separator />
              <CardFooter className="flex flex-col gap-1.5 items-start p-4 pt-3">
                {(project.start_date || project.target_date) && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground w-full text-left">
                    <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {project.start_date && project.target_date
                        ? `${project.start_date}~${project.target_date}`
                        : project.start_date
                        ? `${project.start_date}~`
                        : `~${project.target_date}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground w-full text-left">
                  <User className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{project.member_count || 1}명</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    프로젝트명
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    설명
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    생성일
                  </th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={async (e) => {
                      e.preventDefault()
                      console.log("[프로젝트 클릭 - 리스트] 프로젝트:", {
                        id: project.id,
                        name: project.name,
                        project_code: project.project_code,
                        artistCode
                      })
                      
                      let codeToUse = project.project_code
                      
                      // 프로젝트 코드가 없으면 생성
                      if (!codeToUse) {
                        console.log("[프로젝트 클릭 - 리스트] 프로젝트 코드가 없음, 생성 시작")
                        try {
                          const supabase = createClient()
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
                              break
                            }
                            
                            attempts++
                            if (attempts >= maxAttempts) {
                              toast.error("프로젝트 코드 생성에 실패했습니다")
                              return
                            }
                          } while (true)
                          
                          console.log("[프로젝트 클릭 - 리스트] 생성된 프로젝트 코드:", projectCode)
                          
                          // 프로젝트 코드 업데이트
                          const { error: updateError } = await supabase
                            .from('projects')
                            .update({ project_code: projectCode })
                            .eq('id', project.id)
                          
                          if (updateError) {
                            console.error("프로젝트 코드 업데이트 실패:", updateError)
                            toast.error("프로젝트 코드 생성에 실패했습니다")
                            return
                          }
                          
                          codeToUse = projectCode
                          // 로컬 상태 업데이트
                          updateProject(project.id, { project_code: projectCode })
                        } catch (err) {
                          console.error("프로젝트 코드 생성 중 오류:", err)
                          toast.error("프로젝트 코드 생성에 실패했습니다")
                          return
                        }
                      }
                      
                      const targetUrl = `/console/${artistCode}/projects/${codeToUse}`
                      console.log("[프로젝트 클릭 - 리스트] 이동할 URL:", targetUrl)
                      router.push(targetUrl)
                    }}
                  >
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getProjectColorClass(project.color)} flex-shrink-0`} />
                        <span className="font-medium">{project.name}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="text-sm text-muted-foreground">
                        {project.description || "-"}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(project.created_at)}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleEditProject(project)
                          }}>편집</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePinProject(project.id, !project.is_pinned)
                            }}
                          >
                            {project.is_pinned ? (
                              <>
                                <PinOff className="mr-2 h-4 w-4" />
                                바로가기 고정 해제
                              </>
                            ) : (
                              <>
                                <Pin className="mr-2 h-4 w-4" />
                                바로가기 고정
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleArchiveProject(project.id, activeTab === "active")
                            }}
                          >
                            {activeTab === "active" ? "보관" : "보관 해제"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingProjectId(project.id)
                            }}
                          >
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
