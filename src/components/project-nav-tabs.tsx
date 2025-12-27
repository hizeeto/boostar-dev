"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const tabs = [
  { id: "feed", label: "피드", path: "", disabled: false },
  { id: "workflow", label: "워크플로우", path: "/workflow", disabled: false },
  { id: "calendar", label: "일정", path: "/calendar", disabled: false },
  { id: "release", label: "릴리즈", path: "/release", disabled: false },
  { id: "library", label: "라이브러리", path: "/library", disabled: false },
  { id: "member", label: "멤버", path: "/member", disabled: false },
  { id: "settings", label: "설정", path: "/settings", disabled: false },
]

interface ProjectNavTabsProps {
  projectCode: string
  projectId: string
  artistCode: string
}

export function ProjectNavTabs({ projectCode, projectId, artistCode }: ProjectNavTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  // 클라이언트에서만 마운트 확인
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // 현재 활성 탭 확인
  const getActiveTab = () => {
    if (!pathname) return "feed"
    
    const basePath = `/console/${artistCode}/projects/${projectCode}`
    let currentPath = pathname.replace(basePath, "")
    
    // 정확히 일치하거나 빈 경로인 경우
    if (currentPath === "" || currentPath === "/") {
      return "feed"
    }
    
    // 경로가 정확히 일치하는 탭 찾기
    const exactMatch = tabs.find(t => currentPath === t.path)
    if (exactMatch) {
      return exactMatch.id
    }
    
    // 경로로 시작하는 탭 찾기
    const startsWithMatch = tabs.find(t => t.path !== "" && currentPath.startsWith(t.path))
    if (startsWithMatch) {
      return startsWithMatch.id
    }
    
    return "feed"
  }

  const activeTab = mounted ? getActiveTab() : "feed"

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.disabled) return
    const basePath = `/console/${artistCode}/projects/${projectCode}`
    router.push(`${basePath}${tab.path}`)
  }

  // 클라이언트에서 마운트되기 전에는 빈 div 반환
  if (!mounted) {
    return (
      <div className="border-b bg-background flex-shrink-0">
        <nav className="flex gap-6 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              disabled={tab.disabled}
              className={cn(
                "relative py-4 text-sm font-medium text-muted-foreground",
                tab.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    )
  }

  return (
    <div className="border-b bg-background flex-shrink-0">
      <nav className="flex gap-6 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            disabled={tab.disabled}
            className={cn(
              "relative py-4 text-sm font-medium transition-colors",
              tab.disabled && "opacity-50 cursor-not-allowed",
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
              tab.disabled && "hover:text-muted-foreground"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

