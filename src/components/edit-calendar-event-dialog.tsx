"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"

interface CalendarEvent {
  id: string
  event_date: string
  event_time: string | null
  title: string
  description?: string | null
  is_all_day?: boolean
}

interface EditCalendarEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent | null
  onSuccess: () => void
}

export function EditCalendarEventDialog({
  open,
  onOpenChange,
  event,
  onSuccess,
}: EditCalendarEventDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: new Date(),
    event_time: '',
    is_all_day: false,
  })

  // 이벤트 데이터로 폼 초기화
  useEffect(() => {
    if (open && event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_date: event.event_date ? new Date(event.event_date) : new Date(),
        event_time: event.event_time || '',
        is_all_day: event.is_all_day || false,
      })
    }
  }, [open, event])

  const handleSubmit = async () => {
    if (!event) return

    if (!formData.title.trim()) {
      toast.error("제목을 입력해주세요")
      return
    }

    if (!formData.event_date) {
      toast.error("날짜를 선택해주세요")
      return
    }

    setIsUpdating(true)

    try {
      const supabase = createClient()

      // 날짜를 YYYY-MM-DD 형식으로 변환
      const eventDate = format(formData.event_date, "yyyy-MM-dd")
      
      // 시간이 입력되었는지 확인하고 형식 검증
      let eventTime: string | null = null
      if (!formData.is_all_day && formData.event_time) {
        // HH:mm 형식 검증
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeRegex.test(formData.event_time)) {
          toast.error("시간 형식이 올바르지 않습니다 (HH:mm)")
          setIsUpdating(false)
          return
        }
        eventTime = formData.event_time
      }

      const { error } = await supabase
        .from('project_calendar_events')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          event_date: eventDate,
          event_time: eventTime,
          is_all_day: formData.is_all_day,
        })
        .eq('id', event.id)

      if (error) {
        console.error("일정 수정 오류:", error)
        throw new Error(error.message || "일정 수정에 실패했습니다")
      }

      toast.success("일정이 수정되었습니다")
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error("일정 수정 실패:", err)
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
      toast.error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>일정 수정</DialogTitle>
          <DialogDescription>
            일정 정보를 수정합니다
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="edit-event-title">제목 *</Label>
            <Input
              id="edit-event-title"
              placeholder="일정 제목을 입력하세요"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={100}
            />
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="edit-event-description">설명</Label>
            <Textarea
              id="edit-event-description"
              placeholder="일정에 대한 설명을 입력하세요"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* 날짜 선택 */}
          <div className="space-y-2">
            <Label>날짜 *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.event_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.event_date ? (
                    format(formData.event_date, "yyyy년 MM월 dd일", { locale: ko })
                  ) : (
                    <span>날짜를 선택하세요</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.event_date}
                  onSelect={(date) => date && setFormData({ ...formData, event_date: date })}
                  initialFocus
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 종일 일정 체크박스 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-is-all-day"
              checked={formData.is_all_day}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_all_day: checked === true })
              }
            />
            <Label
              htmlFor="edit-is-all-day"
              className="text-sm font-normal cursor-pointer"
            >
              종일 일정
            </Label>
          </div>

          {/* 시간 입력 (종일 일정이 아닐 때만 표시) */}
          {!formData.is_all_day && (
            <div className="space-y-2">
              <Label htmlFor="edit-event-time">시간</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-event-time"
                  type="time"
                  placeholder="HH:mm"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                시간을 입력하지 않으면 &quot;시간 미정&quot;으로 표시됩니다
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.title.trim() || isUpdating}
          >
            {isUpdating ? "수정 중..." : "수정"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

