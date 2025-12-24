"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useArtistContext } from "@/hooks/use-artist-context"

interface ProjectUserProfileProps {
  projectId: string
}


export function ProjectUserProfile({ projectId }: ProjectUserProfileProps) {
  const artistContext = useArtistContext()
  const activeArtist = artistContext?.activeArtist
  const [loading, setLoading] = useState(true)
  const [myTasks, setMyTasks] = useState(0)

  useEffect(() => {
    if (activeArtist) {
      loadTaskCounts()
    }
  }, [projectId, activeArtist?.id])

  const loadTaskCounts = async () => {
    try {
      const supabase = createClient()
      
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      let userId: string
      
      if (demoUser) {
        userId = DEMO_USER_ID
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        userId = user.id
      }

      // 내 업무 개수 (워크플로우 타입 피드 중 내가 작성한 것)
      const { data: myFeeds } = await supabase
        .from('project_feeds')
        .select('id', { count: 'exact' })
        .eq('project_id', projectId)
        .eq('feed_type', 'workflow')
        .eq('author_id', userId)

      setMyTasks(myFeeds?.length || 0)
    } catch (err) {
      console.error("작업 개수 로드 실패:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">할 일</CardTitle>
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
        <CardTitle className="text-lg">할 일 {myTasks}</CardTitle>
      </CardHeader>
      <CardContent>
        {myTasks === 0 ? (
          <p className="text-sm text-muted-foreground">할 일이 없습니다</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

