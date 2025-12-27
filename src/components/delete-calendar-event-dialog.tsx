"use client"

import { useState } from "react"
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
import { toast } from "@/lib/toast"

interface CalendarEvent {
  id: string
  title: string
}

interface DeleteCalendarEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent | null
  onSuccess: () => void
}

export function DeleteCalendarEventDialog({
  open,
  onOpenChange,
  event,
  onSuccess,
}: DeleteCalendarEventDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!event) return

    setIsDeleting(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('project_calendar_events')
        .delete()
        .eq('id', event.id)

      if (error) {
        console.error("일정 삭제 오류:", error)
        throw new Error(error.message || "일정 삭제에 실패했습니다")
      }

      toast.success("일정이 삭제되었습니다")
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error("일정 삭제 실패:", err)
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>일정 삭제</DialogTitle>
          <DialogDescription>
            정말로 &quot;{event.title}&quot; 일정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

