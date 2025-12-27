"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useArtistContext } from "@/hooks/use-artist-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { Project } from "@/hooks/use-projects"
import { ProjectNavTabs } from "@/components/project-nav-tabs"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "@/lib/toast"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateCalendarEventDialog } from "@/components/create-calendar-event-dialog"
import { EditCalendarEventDialog } from "@/components/edit-calendar-event-dialog"
import { DeleteCalendarEventDialog } from "@/components/delete-calendar-event-dialog"
import { format, addMonths } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"

// UUID 형식 검증 함수
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

interface CalendarEvent {
  id: string
  event_date: string
  event_time: string | null
  title: string
  description?: string | null
  is_all_day?: boolean
}

// 데모 데이터
const DEMO_EVENTS: CalendarEvent[] = [
  { id: "1", event_date: "2025-12-05", event_time: "15:00", title: "앨범 구성 미팅" },
  { id: "2", event_date: "2025-12-24", event_time: "13:00", title: "합주 연습" },
  { id: "3", event_date: "2025-12-26", event_time: "14:00", title: "전체 팀원 회의" },
]

export default function CalendarPage() {
  const params = useParams()
  const router = useRouter()
  const artistContext = useArtistContext()
  const activeArtist = artistContext?.activeArtist
  const projectCode = params.projectCode as string
  const artistCode = params.artistCode as string
  const isMobile = useIsMobile()
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({})
  const [useDemoData, setUseDemoData] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null)

  const loadProject = useCallback(async () => {
    if (!activeArtist) {
      // 아티스트가 아직 로딩 중이면 기다림
      if (artistContext?.loading) {
        return
      }
      // 로딩이 완료되었지만 아티스트가 없는 경우에만 리다이렉트
      if (artistContext && !artistContext.loading && artistContext.artists.length === 0) {
        console.error("[일정] 활성 아티스트가 없습니다")
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
        console.error("[일정] 프로젝트 조회 오류:", error)
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
      console.error("[일정] 프로젝트 로드 실패:", err)
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

  // 이벤트 로드
  const loadEvents = useCallback(async () => {
    if (!project?.id) return

    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('project_calendar_events')
        .select('id, event_date, event_time, title, description, is_all_day')
        .eq('project_id', project.id)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true, nullsFirst: false })

      if (error) {
        console.error("이벤트 로드 오류:", error)
        setUseDemoData(true)
        return
      }

      if (data && data.length > 0) {
        setEvents(data)
        setUseDemoData(false)
      } else {
        setUseDemoData(true)
      }
    } catch (err) {
      console.error("이벤트 로드 실패:", err)
      setUseDemoData(true)
    }
  }, [project?.id])

  useEffect(() => {
    if (project?.id) {
      loadEvents()
    }
  }, [project?.id, loadEvents])

  useEffect(() => {
    // 날짜별로 이벤트 그룹화
    const grouped: Record<string, CalendarEvent[]> = {}
    const eventsToUse = useDemoData ? DEMO_EVENTS : events
    eventsToUse.forEach((event) => {
      const dateKey = event.event_date
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })
    setEventsByDate(grouped)
  }, [events, useDemoData])

  // 날짜에 이벤트가 있는지 확인
  const hasEvent = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd")
    return !!eventsByDate[dateKey] && eventsByDate[dateKey].length > 0
  }

  // 선택된 날짜의 이벤트 가져오기
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd")
  const selectedDateEvents = eventsByDate[selectedDateKey] || []

  // 이벤트 시간 포맷팅
  const formatEventTime = (event: CalendarEvent) => {
    if (event.event_time) {
      return format(new Date(`2000-01-01T${event.event_time}`), "HH:mm", { locale: ko })
    }
    return null
  }

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    const newMonth = addMonths(currentMonth, -1)
    setCurrentMonth(newMonth)
  }

  // 다음 달로 이동
  const goToNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1)
    setCurrentMonth(newMonth)
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
      
      {/* 일정 컨텐츠 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 헤더 */}
        <div className={cn(
          "flex items-center justify-between pt-6 pb-4 flex-shrink-0",
          isMobile ? "px-4" : "px-6"
        )}>
          <h2 className="text-xl font-semibold">일정</h2>
          <Button 
            size="sm" 
            className="gap-1"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            일정 추가
          </Button>
        </div>

        {/* 메인 컨텐츠 영역: 좌측 캘린더, 우측 상세 일정 */}
        <div className={cn(
          "flex flex-1 pb-6 overflow-hidden",
          isMobile ? "flex-col gap-4 px-4" : "flex-row gap-6 px-6"
        )}>
          {/* 좌측: 캘린더 */}
          <div className={cn(
            "flex-shrink-0",
            isMobile ? "w-full" : "w-[400px]"
          )}>
            <Card className={cn(
              "w-full",
              isMobile ? "h-auto" : "h-full"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {format(currentMonth, "yyyy년 MM월", { locale: ko })}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={goToPreviousMonth}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={goToNextMonth}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  locale={ko}
                  className="rounded-md border-0 p-0 w-full"
                  modifiers={{
                    hasEvent: (date) => hasEvent(date),
                  }}
                  modifiersClassNames={{
                    hasEvent: "has-event",
                  }}
                  classNames={{
                    months: "flex flex-col space-y-0 w-full",
                    month: "space-y-0 w-full",
                    month_caption: "hidden",
                    month_grid: "w-full border-collapse",
                    weekdays: "flex mb-2 w-full justify-between",
                    weekday: "text-muted-foreground rounded-md flex-1 font-normal text-sm flex items-center justify-center",
                    week: "flex w-full mt-2 justify-between",
                    day: "flex-1 h-10 text-center text-sm p-0 relative",
                    day_button: cn(
                      "h-10 w-full p-0 font-normal aria-selected:opacity-100 rounded-md relative",
                      "aria-selected:bg-primary aria-selected:text-primary-foreground",
                      "hover:bg-accent hover:text-accent-foreground"
                    ),
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* 우측: 선택된 날짜의 상세 일정 */}
          <div className={cn(
            "flex-1",
            isMobile ? "overflow-y-visible" : "overflow-y-auto"
          )}>
            <Card className={cn(
              "w-full",
              isMobile ? "h-auto" : "h-full"
            )}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, "yyyy년 MM월 dd일", { locale: ko })} 일정
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDateEvents.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDateEvents
                      .sort((a, b) => {
                        // 시간 순으로 정렬 (시간이 없는 것은 뒤로)
                        if (!a.event_time && !b.event_time) return 0
                        if (!a.event_time) return 1
                        if (!b.event_time) return -1
                        return a.event_time.localeCompare(b.event_time)
                      })
                      .map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors group"
                        >
                          {event.event_time && (
                            <div className="flex-shrink-0">
                              <div className="text-lg font-semibold text-primary">
                                {formatEventTime(event)}
                              </div>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-medium mb-1">{event.title}</h3>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mb-1">{event.description}</p>
                            )}
                            {!event.event_time && (
                              <p className="text-sm text-muted-foreground">시간 미정</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingEvent(event)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletingEvent(event)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                    <p className="text-muted-foreground text-lg mb-2">
                      선택한 날짜에 일정이 없습니다
                    </p>
                    <p className="text-sm text-muted-foreground">
                      일정을 추가하려면 상단의 &quot;일정 추가&quot; 버튼을 클릭하세요
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 일정 추가 다이얼로그 */}
      {project && (
        <CreateCalendarEventDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          projectId={project.id}
          initialDate={selectedDate}
          onSuccess={() => {
            loadEvents()
          }}
        />
      )}

      {/* 일정 수정 다이얼로그 */}
      <EditCalendarEventDialog
        open={editingEvent !== null}
        onOpenChange={(open) => !open && setEditingEvent(null)}
        event={editingEvent}
        onSuccess={() => {
          loadEvents()
        }}
      />

      {/* 일정 삭제 다이얼로그 */}
      <DeleteCalendarEventDialog
        open={deletingEvent !== null}
        onOpenChange={(open) => !open && setDeletingEvent(null)}
        event={deletingEvent}
        onSuccess={() => {
          loadEvents()
        }}
      />
    </div>
  )
}

