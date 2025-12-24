"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/lib/toast"

interface CreateFeedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onSuccess: () => void
}

const feedTypes = [
  { value: 'announcement', label: '공지' },
  { value: 'workflow', label: '워크플로우' },
  { value: 'release', label: '릴리즈' },
  { value: 'calendar', label: '캘린더' },
  { value: 'library', label: '라이브러리' },
  { value: 'member', label: '멤버' },
  { value: 'settings', label: '설정' },
]

export function CreateFeedDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: CreateFeedDialogProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    feed_type: 'announcement' as const,
    title: '',
    content: '',
  })

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("제목을 입력해주세요")
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

      const { error } = await supabase
        .from('project_feeds')
        .insert({
          project_id: projectId,
          feed_type: formData.feed_type,
          title: formData.title.trim(),
          content: formData.content.trim() || null,
          author_id: userId,
          metadata: {},
        })

      if (error) {
        console.error("피드 생성 오류:", error)
        throw new Error(error.message || "피드 생성에 실패했습니다")
      }

      toast.success("게시물이 작성되었습니다")
      setFormData({
        feed_type: 'announcement',
        title: '',
        content: '',
      })
      onSuccess()
    } catch (err) {
      console.error("피드 생성 실패:", err)
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
          <DialogTitle>게시물 작성</DialogTitle>
          <DialogDescription>
            프로젝트에 새로운 게시물을 작성합니다
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 피드 타입 선택 */}
          <div className="space-y-2">
            <Label htmlFor="feed-type">타입</Label>
            <Select
              value={formData.feed_type}
              onValueChange={(value) => setFormData({ ...formData, feed_type: value as any })}
            >
              <SelectTrigger id="feed-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {feedTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="feed-title">제목 *</Label>
            <Input
              id="feed-title"
              placeholder="제목을 입력하세요"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={100}
            />
          </div>

          {/* 내용 */}
          <div className="space-y-2">
            <Label htmlFor="feed-content">내용</Label>
            <Textarea
              id="feed-content"
              placeholder="내용을 입력하세요"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
            />
          </div>
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
            {isCreating ? "작성 중..." : "작성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

