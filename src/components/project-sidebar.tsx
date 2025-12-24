"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { ProjectUserProfile } from "./project-user-profile"
import { ProjectCalendarWidget } from "./project-calendar-widget"

interface ProjectSidebarProps {
  projectId: string
}

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* 사용자 프로필 카드 */}
      <ProjectUserProfile projectId={projectId} />
      
      {/* 캘린더 위젯 */}
      <ProjectCalendarWidget projectId={projectId} />
    </div>
  )
}

