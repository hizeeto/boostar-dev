"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useArtistContext } from "@/hooks/use-artist-context"
import { Project } from "@/hooks/use-projects"
import { ProjectNavTabs } from "@/components/project-nav-tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter, Columns2, Plus } from "lucide-react"
import { toast } from "@/lib/toast"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

// UUID 형식 검증 함수
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// 업무 상태 타입
type TaskStatus = "대기" | "진행 중" | "피드백" | "완료"

// 우선순위 타입
type TaskPriority = "긴급" | "높음" | "보통" | "낮음"

// 열 타입
type ColumnKey =
  | "name"
  | "status"
  | "assignee"
  | "priority"
  | "startDate"
  | "dueDate"
  | "progress"
  | "creator"

// 열 정의
const COLUMN_DEFINITIONS: Record<ColumnKey, { label: string; key: ColumnKey }> =
  {
    name: { label: "업무명", key: "name" },
    status: { label: "상태", key: "status" },
    assignee: { label: "담당자", key: "assignee" },
    priority: { label: "우선순위", key: "priority" },
    startDate: { label: "시작일", key: "startDate" },
    dueDate: { label: "마감일", key: "dueDate" },
    progress: { label: "진척도", key: "progress" },
    creator: { label: "작성자", key: "creator" },
  }

// 업무 데이터 타입
interface Task {
  id: string
  name: string
  status: TaskStatus
  assignee: string
  assigneeCount?: number
  priority: TaskPriority
  startDate: string
  dueDate: string
  progress: number
  creator: string
}

// 샘플 데이터 (이미지 기반)
const sampleTasks: Task[] = [
  {
    id: "1",
    name: "[릴리즈] 유통사 선정 및 계약 진행",
    status: "대기",
    assignee: "이민형",
    priority: "높음",
    startDate: "2025-10-27",
    dueDate: "2025-10-28",
    progress: 0,
    creator: "황은주",
  },
  {
    id: "2",
    name: "[릴리즈] 유통사별 계약 등 조건 비교",
    status: "대기",
    assignee: "이상현",
    priority: "높음",
    startDate: "2025-10-26",
    dueDate: "2025-10-27",
    progress: 0,
    creator: "이민형",
  },
  {
    id: "3",
    name: "[릴리즈] 릴리즈 신청",
    status: "대기",
    assignee: "이민형",
    priority: "보통",
    startDate: "2025-10-24",
    dueDate: "2025-10-24",
    progress: 0,
    creator: "이민형",
  },
  {
    id: "4",
    name: "[릴리즈] 앨범 정보 완성",
    status: "진행 중",
    assignee: "김원기",
    priority: "낮음",
    startDate: "2025-10-20",
    dueDate: "2025-10-21",
    progress: 41,
    creator: "황은주",
  },
  {
    id: "5",
    name: "[커버아트] 커버 아트 제작",
    status: "피드백",
    assignee: "황은주",
    priority: "긴급",
    startDate: "2025-09-25",
    dueDate: "2025-10-14",
    progress: 75,
    creator: "황은주",
  },
  {
    id: "6",
    name: "[커버아트] 커버 아트 콘셉트 레퍼런스 수집",
    status: "완료",
    assignee: "황은주",
    priority: "보통",
    startDate: "2025-09-20",
    dueDate: "2025-09-25",
    progress: 100,
    creator: "황은주",
  },
  {
    id: "7",
    name: "[믹싱/마스터링] 모든 트랙 믹싱/마스터링 진행",
    status: "완료",
    assignee: "김원기",
    assigneeCount: 1,
    priority: "높음",
    startDate: "2025-09-15",
    dueDate: "2025-09-27",
    progress: 100,
    creator: "이민형",
  },
  {
    id: "8",
    name: "[녹음] 세션 뮤직 브리프 전달",
    status: "완료",
    assignee: "이민형",
    priority: "보통",
    startDate: "2025-09-09",
    dueDate: "2025-09-09",
    progress: 100,
    creator: "이민형",
  },
  {
    id: "9",
    name: "[녹음] 세션 메인 테이크 녹음",
    status: "완료",
    assignee: "이민형",
    assigneeCount: 4,
    priority: "높음",
    startDate: "2025-09-05",
    dueDate: "2025-09-09",
    progress: 100,
    creator: "지석현",
  },
  {
    id: "10",
    name: "[녹음] 트랙별 보컬 가이드 녹음",
    status: "완료",
    assignee: "황은주",
    priority: "높음",
    startDate: "2025-09-03",
    dueDate: "2025-09-05",
    progress: 100,
    creator: "이민형",
  },
  {
    id: "11",
    name: "[기획] 타깃 청자 및 포지셔닝 메모",
    status: "완료",
    assignee: "이민형",
    priority: "낮음",
    startDate: "2025-09-02",
    dueDate: "2025-09-02",
    progress: 100,
    creator: "이상현",
  },
  {
    id: "12",
    name: "[기획] 발매 일정 및 마일스톤 설계",
    status: "완료",
    assignee: "이민형",
    priority: "낮음",
    startDate: "2025-09-01",
    dueDate: "2025-09-02",
    progress: 100,
    creator: "김원기",
  },
  {
    id: "13",
    name: "[기획] Track 리스트 및 구조 확정",
    status: "완료",
    assignee: "김원기",
    assigneeCount: 2,
    priority: "높음",
    startDate: "2025-08-23",
    dueDate: "2025-09-01",
    progress: 100,
    creator: "이상현",
  },
  {
    id: "14",
    name: "[기획] EP 콘셉트 및 키워드 정리",
    status: "완료",
    assignee: "이민형",
    priority: "낮음",
    startDate: "2025-08-14",
    dueDate: "2025-08-23",
    progress: 100,
    creator: "황은주",
  },
]

// 상태 색상 매핑
const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case "대기":
      return "bg-yellow-500"
    case "진행 중":
      return "bg-green-500"
    case "피드백":
      return "bg-blue-500"
    case "완료":
      return "bg-gray-400"
    default:
      return "bg-gray-400"
  }
}

// 우선순위별 색상 설정
const PRIORITY_COLORS: Record<
  TaskPriority,
  { bg: string; text: string; hover: string }
> = {
  긴급: {
    bg: "bg-red-500",
    text: "text-white",
    hover: "hover:bg-red-500",
  },
  높음: {
    bg: "bg-red-100",
    text: "text-red-800",
    hover: "hover:bg-red-100",
  },
  보통: {
    bg: "bg-green-500",
    text: "text-white",
    hover: "hover:bg-green-500",
  },
  낮음: {
    bg: "bg-green-200",
    text: "text-green-800",
    hover: "hover:bg-green-200",
  },
}

// 우선순위 색상 클래스 반환
const getPriorityColorClasses = (priority: TaskPriority): string => {
  const colors = PRIORITY_COLORS[priority] || {
    bg: "bg-gray-200",
    text: "text-gray-800",
    hover: "hover:bg-gray-200",
  }
  return `${colors.bg} ${colors.text} ${colors.hover}`
}

// 업무명 파싱: [태그] 나머지 텍스트 형식을 파싱
const parseTaskName = (name: string) => {
  const match = name.match(/^\[([^\]]+)\]\s*(.*)$/)
  if (match) {
    return {
      tag: match[1],
      rest: match[2],
    }
  }
  return {
    tag: null,
    rest: name,
  }
}

export default function WorkflowPage() {
  const params = useParams()
  const router = useRouter()
  const artistContext = useArtistContext()
  const activeArtist = artistContext?.activeArtist
  const projectCode = params.projectCode as string
  const artistCode = params.artistCode as string

  const [mounted, setMounted] = useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tasks, setTasks] = useState<Task[]>(sampleTasks)
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(
    {
      name: true,
      status: true,
      assignee: true,
      priority: true,
      startDate: true,
      dueDate: true,
      progress: true,
      creator: true,
    }
  )

  // 클라이언트에서만 마운트 확인
  useEffect(() => {
    setMounted(true)
  }, [])

  const loadProject = useCallback(async () => {
    if (!activeArtist) {
      // 아티스트가 아직 로딩 중이면 기다림
      if (artistContext?.loading) {
        return
      }
      // 로딩이 완료되었지만 아티스트가 없는 경우에만 리다이렉트
      if (artistContext && !artistContext.loading && artistContext.artists.length === 0) {
        console.error("[워크플로우] 활성 아티스트가 없습니다")
        router.push(`/console/${artistCode}/projects`)
      }
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from("projects")
        .select("*")
        .eq("artist_id", activeArtist.id)

      if (isValidUUID(projectCode)) {
        query = query.or(`project_code.eq.${projectCode},id.eq.${projectCode}`)
      } else {
        query = query.eq("project_code", projectCode)
      }

      const { data, error } = await query.maybeSingle()

      if (error) {
        console.error("[워크플로우] 프로젝트 조회 오류:", error)
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
      console.error("[워크플로우] 프로젝트 로드 실패:", err)
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

  // 검색 및 상태 필터링
  const filteredTasks = tasks.filter((task) => {
    // 검색 필터
    const matchesSearch = task.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())

    // 상태 필터
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "waiting" && task.status === "대기") ||
      (statusFilter === "in-progress" && task.status === "진행 중") ||
      (statusFilter === "feedback" && task.status === "피드백") ||
      (statusFilter === "completed" && task.status === "완료")

    return matchesSearch && matchesStatus
  })

  // 클라이언트에서 마운트되기 전에는 로딩 표시
  if (!mounted || !artistContext || artistContext.loading || !activeArtist || loading) {
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
    <div className="flex flex-1 flex-col h-full bg-white">
      {/* 상단 네비게이션 탭 */}
      <ProjectNavTabs
        projectCode={projectCode}
        projectId={project.id}
        artistCode={artistCode}
      />

      {/* 워크플로우 컨텐츠 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 상단 헤더 바 */}
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between gap-3 flex-shrink-0">
          {/* 왼쪽: 드롭다운 */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[100px] h-9 bg-white border text-sm">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="waiting">대기</SelectItem>
              <SelectItem value="in-progress">진행 중</SelectItem>
              <SelectItem value="feedback">피드백</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
            </SelectContent>
          </Select>

          {/* 오른쪽: 검색, 필터, 열보기, 업무 추가 */}
          <div className="flex items-center gap-2">
            {/* 검색 입력 */}
            <div className="relative w-[240px]">
              <Input
                type="text"
                placeholder="검색어를 입력해 주세요."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pr-10 bg-white border"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3"
            >
              <Filter className="h-4 w-4 mr-1.5" />
              필터
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3"
                >
                  <Columns2 className="h-4 w-4 mr-1.5" />
                  열 보기
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">열 보기</h4>
                    <p className="text-xs text-muted-foreground">
                      표시할 열을 선택하세요.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {Object.entries(COLUMN_DEFINITIONS).map(([key, column]) => (
                      <div
                        key={key}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={key}
                          checked={visibleColumns[key as ColumnKey]}
                          onCheckedChange={(checked) => {
                            setVisibleColumns((prev) => ({
                              ...prev,
                              [key]: checked === true,
                            }))
                          }}
                        />
                        <Label
                          htmlFor={key}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {column.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              size="sm"
              className="h-9 px-4"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              업무 추가
            </Button>
          </div>
        </div>

        {/* 테이블 영역 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                {visibleColumns.name && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    업무명
                  </th>
                )}
                {visibleColumns.status && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    상태
                  </th>
                )}
                {visibleColumns.assignee && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    담당자
                  </th>
                )}
                {visibleColumns.priority && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    우선순위
                  </th>
                )}
                {visibleColumns.startDate && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    시작일
                  </th>
                )}
                {visibleColumns.dueDate && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    마감일
                  </th>
                )}
                {visibleColumns.progress && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    진척도
                  </th>
                )}
                {visibleColumns.creator && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    작성자
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {visibleColumns.name && (
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {(() => {
                        const parsed = parseTaskName(task.name)
                        return (
                          <>
                            {parsed.tag && (
                              <span className="text-primary font-semibold">
                                {parsed.tag}
                              </span>
                            )}
                            {parsed.tag && parsed.rest && " "}
                            {parsed.rest}
                          </>
                        )
                      })()}
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor(
                            task.status
                          )}`}
                        />
                        <span className="text-sm text-gray-700">{task.status}</span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.assignee && (
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {task.assignee}
                      {task.assigneeCount !== undefined && (
                        <span className="text-gray-500">
                          {" "}
                          외 {task.assigneeCount}명
                        </span>
                      )}
                    </td>
                  )}
                  {visibleColumns.priority && (
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`${getPriorityColorClasses(
                          task.priority
                        )} border-transparent text-xs px-2 py-0.5`}
                      >
                        {task.priority}
                      </Badge>
                    </td>
                  )}
                  {visibleColumns.startDate && (
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {task.startDate}
                    </td>
                  )}
                  {visibleColumns.dueDate && (
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {task.dueDate}
                    </td>
                  )}
                  {visibleColumns.progress && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              task.progress === 0
                                ? "bg-gray-300"
                                : "bg-primary"
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-700 min-w-[3rem]">
                          {task.progress}%
                        </span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.creator && (
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {task.creator}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  )
}

