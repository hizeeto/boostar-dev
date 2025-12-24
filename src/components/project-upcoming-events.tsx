"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface ProjectUpcomingEventsProps {
  projectId: string
}

interface CalendarEvent {
  id: string
  title: string
  event_date: string
  event_time: string | null
  description: string | null
}

export function ProjectUpcomingEvents({ projectId }: ProjectUpcomingEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUpcomingEvents()
  }, [projectId])

  const loadUpcomingEvents = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // 오늘 이후의 이벤트만 가져오기 (최대 5개)
      const { data, error } = await supabase
        .from('project_calendar_events')
        .select('id, title, event_date, event_time, description')
        .eq('project_id', projectId)
        .gte('event_date', format(today, "yyyy-MM-dd"))
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true, nullsFirst: false })
        .limit(5)

      if (error) {
        console.error("이벤트 로드 오류:", error)
        return
      }

      setEvents(data || [])
    } catch (err) {
      console.error("이벤트 로드 실패:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatEventTime = (event: CalendarEvent) => {
    if (event.event_time) {
      return format(new Date(`2000-01-01T${event.event_time}`), "HH:mm", { locale: ko })
    }
    return null
  }

  const formatEventDate = (dateString: string) => {
    return format(new Date(dateString), "yyyy-MM-dd", { locale: ko })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">다가오는 일정</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">다가오는 일정</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">다가오는 일정이 없습니다</p>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-16 text-xs text-muted-foreground">
                  <div>{formatEventDate(event.event_date)}</div>
                  {formatEventTime(event) && (
                    <div className="mt-1 font-medium">{formatEventTime(event)}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{event.title}</p>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

