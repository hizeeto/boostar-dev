"use client"

import * as React from "react"
import { Check, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Notification {
  id: string
  title: string
  message: string
  time: string
  isRead: boolean
  type?: "info" | "warning" | "success" | "error"
}

interface NotificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationDialog({ open, onOpenChange }: NotificationDialogProps) {
  // TODO: 실제 알림 데이터를 API에서 가져오도록 구현
  const [notifications, setNotifications] = React.useState<Notification[]>([
    {
      id: "1",
      title: "새로운 프로젝트 초대",
      message: "프로젝트 '새 앨범 작업'에 초대되었습니다.",
      time: "5분 전",
      isRead: false,
      type: "info",
    },
    {
      id: "2",
      title: "일정 알림",
      message: "내일 오후 3시에 회의가 예정되어 있습니다.",
      time: "1시간 전",
      isRead: false,
      type: "warning",
    },
    {
      id: "3",
      title: "작업 완료",
      message: "작업이 성공적으로 완료되었습니다.",
      time: "2시간 전",
      isRead: true,
      type: "success",
    },
  ])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // 다이얼로그가 닫힐 때 상태 초기화하지 않음 (알림은 유지)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                알림
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                    {unreadCount}
                  </span>
                )}
              </DialogTitle>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                모두 읽음
              </Button>
            )}
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                알림이 없습니다.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.isRead
                      ? "bg-muted/50"
                      : "bg-background border-primary/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={`text-sm font-semibold ${
                            !notification.isRead ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <span className="h-2 w-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleMarkAsRead(notification.id)}
                          title="읽음 표시"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDelete(notification.id)}
                        title="삭제"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

