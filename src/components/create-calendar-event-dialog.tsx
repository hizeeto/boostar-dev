"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"
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

interface CreateCalendarEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  initialDate?: Date
  onSuccess: () => void
}

export function CreateCalendarEventDialog({
  open,
  onOpenChange,
  projectId,
  initialDate,
  onSuccess,
}: CreateCalendarEventDialogProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: initialDate || new Date(),
    event_time: '',
    is_all_day: false,
  })

  // 다이얼로그가 열릴 때 초기 날짜 설정
  useEffect(() => {
    if (open && initialDate) {
      setFormData(prev => ({ ...prev, event_date: initialDate }))
    }
  }, [open, initialDate])

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("제목을 입력해주세요")
      return
    }

    if (!formData.event_date) {
      toast.error("날짜를 선택해주세요")
      return
    }

    setIsCreating(true)

    try {
      const supabase = createClient()
      
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      let userId: string
      
      if (demoUser) {
        userId = DEMO_USER_ID
      } else {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          throw new Error("로그인이 필요합니다")
        }
        
        userId = user.id
      }

      // 날짜를 YYYY-MM-DD 형식으로 변환
      const eventDate = format(formData.event_date, "yyyy-MM-dd")
      
      // 시간이 입력되었는지 확인하고 형식 검증
      let eventTime: string | null = null
      if (!formData.is_all_day && formData.event_time) {
        // HH:mm 형식 검증
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeRegex.test(formData.event_time)) {
          toast.error("시간 형식이 올바르지 않습니다 (HH:mm)")
          setIsCreating(false)
          return
        }
        eventTime = formData.event_time
      }

      const { error } = await supabase
        .from('project_calendar_events')
        .insert({
          project_id: projectId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          event_date: eventDate,
          event_time: eventTime,
          is_all_day: formData.is_all_day,
          created_by: userId,
        })

      if (error) {
        console.error("일정 생성 오류:", error)
        throw new Error(error.message || "일정 생성에 실패했습니다")
      }

      toast.success("일정이 추가되었습니다")
      setFormData({
        title: '',
        description: '',
        event_date: initialDate || new Date(),
        event_time: '',
        is_all_day: false,
      })
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error("일정 생성 실패:", err)
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
      toast.error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>일정 추가</DialogTitle>
          <DialogDescription>
            프로젝트에 새로운 일정을 추가합니다
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="event-title">제목 *</Label>
            <Input
              id="event-title"
              placeholder="일정 제목을 입력하세요"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={100}
            />
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="event-description">설명</Label>
            <Textarea
              id="event-description"
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
              id="is-all-day"
              checked={formData.is_all_day}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_all_day: checked === true })
              }
            />
            <Label
              htmlFor="is-all-day"
              className="text-sm font-normal cursor-pointer"
            >
              종일 일정
            </Label>
          </div>

          {/* 시간 입력 (종일 일정이 아닐 때만 표시) */}
          {!formData.is_all_day && (
            <div className="space-y-2">
              <Label htmlFor="event-time">시간</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="event-time"
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
            disabled={isCreating}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.title.trim() || isCreating}
          >
            {isCreating ? "추가 중..." : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

