"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface ProjectCalendarWidgetProps {
  projectId: string
}

interface CalendarEvent {
  id: string
  event_date: string
  event_time: string | null
  title: string
}

// 데모 데이터
const DEMO_EVENTS: CalendarEvent[] = [
  { id: "1", event_date: "2025-12-05", event_time: "15:00", title: "앨범 구성 미팅" },
  { id: "2", event_date: "2025-12-24", event_time: "13:00", title: "합주 연습" },
  { id: "3", event_date: "2025-12-26", event_time: "14:00", title: "전체 팀원 회의" },
]

export function ProjectCalendarWidget({ projectId }: ProjectCalendarWidgetProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()) // 오늘 날짜
  const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({})
  const [useDemoData, setUseDemoData] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [projectId])

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

  const loadEvents = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('project_calendar_events')
        .select('id, event_date, event_time, title')
        .eq('project_id', projectId)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true, nullsFirst: false })

      if (error) {
        console.error("이벤트 로드 오류:", error)
        // 에러 발생 시 데모 데이터 사용
        setUseDemoData(true)
        return
      }

      if (data && data.length > 0) {
        setEvents(data)
        setUseDemoData(false)
      } else {
        // 데이터가 없으면 데모 데이터 사용
        setUseDemoData(true)
      }
    } catch (err) {
      console.error("이벤트 로드 실패:", err)
      // 에러 발생 시 데모 데이터 사용
      setUseDemoData(true)
    }
  }

  // 날짜에 이벤트가 있는지 확인
  const hasEvent = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd")
    return !!eventsByDate[dateKey] && eventsByDate[dateKey].length > 0
  }

  const currentMonth = format(selectedDate, "yyyy년 MM월", { locale: ko })

  // 이벤트 시간 포맷팅
  const formatEventTime = (event: CalendarEvent) => {
    if (event.event_time) {
      return format(new Date(`2000-01-01T${event.event_time}`), "HH:mm", { locale: ko })
    }
    return null
  }

  // 현재 월의 이벤트만 필터링
  const eventsToUse = useDemoData ? DEMO_EVENTS : events
  const currentMonthEvents = eventsToUse.filter((event) => {
    const eventDate = new Date(event.event_date)
    return (
      eventDate.getFullYear() === selectedDate.getFullYear() &&
      eventDate.getMonth() === selectedDate.getMonth()
    )
  }).sort((a, b) => {
    // 날짜와 시간 순으로 정렬
    const dateCompare = a.event_date.localeCompare(b.event_date)
    if (dateCompare !== 0) return dateCompare
    return (a.event_time || "").localeCompare(b.event_time || "")
  })

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{currentMonth}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          defaultMonth={new Date()}
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
        {/* 이벤트 리스트 */}
        {currentMonthEvents.length > 0 && (
          <div className="pt-4 border-t space-y-3">
            {currentMonthEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground whitespace-nowrap">
                  {format(new Date(event.event_date), "MM-dd", { locale: ko })}
                </span>
                <span className="font-medium flex-1 min-w-0 truncate">{event.title}</span>
                {formatEventTime(event) && (
                  <span className="text-muted-foreground font-medium whitespace-nowrap">
                    {formatEventTime(event)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

