"use client"

import { Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ArtistMembersHeader } from "@/components/artist-members-header"
import { useProjectsContext } from "@/hooks/use-projects-context"

type ConsoleLayoutProps = {
  user: {
    name: string
    email: string
    avatar: string
  }
  children?: React.ReactNode
}

// 경로에 따른 메뉴명 매핑 (app-sidebar.tsx의 메뉴 구조와 동기화)
const getPageTitle = (pathname: string): string => {
  // /console/[artistCode]/... 형식의 경로 처리
  if (pathname.startsWith("/console/")) {
    const segments = pathname.split("/").filter(Boolean)
    
    // /console/[artistCode]/home
    if (segments.length === 3 && segments[2] === "home") {
      return "홈"
    }
    
    // /console/[artistCode]/projects
    if (segments.length === 3 && segments[2] === "projects") {
      return "프로젝트"
    }
    
    // /console/[artistCode]/artist-setting
    if (segments.length === 3 && segments[2] === "artist-setting") {
      return "아티스트 스페이스 관리"
    }
    
    // /console/[artistCode]/messages
    if (segments.length === 3 && segments[2] === "messages") {
      return "메시지"
    }
    
    // 기타 동적 경로
    if (segments.length >= 3) {
      const lastSegment = segments[segments.length - 1]
      return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
    }
  }

  // /console 경로인 경우
  if (pathname === "/console") {
    return "Console"
  }

  // 레거시 경로 지원 (리다이렉트되지만 혹시 모를 경우)
  if (pathname === "/console/artist-setting") {
    return "아티스트 스페이스 관리"
  }

  // 사용자 프로필 설정 (아티스트 코드 없음)
  if (pathname === "/console/settings") {
    return "계정 설정"
  }

  // 레거시 경로 지원 (리다이렉트되지만 혹시 모를 경우)
  if (pathname === "/console/projects") {
    return "프로젝트"
  }

  if (pathname === "/console/home") {
    return "홈"
  }

  return "Console"
}

const settingsTabs = [
  { id: "profile", label: "프로필" },
  { id: "security", label: "로그인·보안" },
  { id: "notifications", label: "알림 설정" },
  { id: "preferences", label: "환경 설정" },
]

const artistSettingTabs = [
  { id: "profile", label: "프로필" },
  { id: "member", label: "멤버" },
  { id: "role", label: "역할" },
  { id: "permission", label: "권한" },
]

function ConsoleLayoutContentInner({ user, children }: ConsoleLayoutProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { projects } = useProjectsContext()
  
  // 프로젝트 페이지인지 확인 및 프로젝트명 가져오기
  const isProjectPage = pathname?.match(/^\/console\/[^/]+\/projects\/[^/]+/)
  let projectName: string | null = null
  if (isProjectPage && pathname) {
    const segments = pathname.split("/").filter(Boolean)
    // 프로젝트 페이지 또는 프로젝트 하위 페이지인 경우 (segments.length >= 4)
    if (segments.length >= 4 && segments[0] === "console" && segments[2] === "projects") {
      const projectCode = segments[3]
      const project = projects.find(p => p.project_code === projectCode)
      if (project) {
        projectName = project.name
      }
    }
  }
  
  // 프로젝트 페이지인 경우 프로젝트명을 표시, 아니면 기본 타이틀
  const pageTitle = projectName || getPageTitle(pathname)
  // 사용자 프로필 설정 페이지만 체크 (아티스트 코드 없음)
  const isSettingsPage = pathname === "/console/settings"
  // 아티스트 관리 페이지 체크
  const isArtistSettingPage = pathname.includes("/artist-setting")
  const activeTab = searchParams.get("tab") || (isArtistSettingPage ? "profile" : "profile")
  
  // 아티스트 스페이스 페이지인지 확인 (/console/[artistCode]/... 형식)
  const isArtistSpacePage = pathname.startsWith("/console/") && pathname.split("/").filter(Boolean).length >= 3
  
  // 아티스트 관리 페이지인 경우 artistCode 추출
  let artistCode: string | null = null
  if (isArtistSettingPage && pathname.startsWith("/console/")) {
    const segments = pathname.split("/").filter(Boolean)
    // /console/[artistCode]/artist-setting 형식인 경우
    if (segments.length === 3 && segments[0] === "console" && segments[2] === "artist-setting") {
      artistCode = segments[1]
    }
  }
  
  // 아티스트 스페이스 페이지인 경우 artistCode 추출
  if (isArtistSpacePage && !artistCode && pathname.startsWith("/console/")) {
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length >= 3 && segments[0] === "console") {
      artistCode = segments[1]
    }
  }

  return (
    <SidebarProvider className="overflow-x-hidden">
      <AppSidebar user={user} />
      <SidebarInset className="flex flex-col overflow-x-hidden w-full max-w-full">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb className="flex-1">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {isArtistSpacePage && artistCode && <ArtistMembersHeader artistCode={artistCode} />}
        </header>
        {isSettingsPage && (
          <div className="sticky top-16 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
            <nav className="flex gap-6 px-4">
              {settingsTabs.map((tab) => {
                const isActive = activeTab === tab.id
                // 사용자 프로필 설정은 항상 /console/settings 사용 (아티스트 코드 없음)
                const tabHref = `/console/settings?tab=${tab.id}`
                return (
                  <Link
                    key={tab.id}
                    href={tabHref}
                    className={`relative py-4 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
        {isArtistSettingPage && artistCode && (
          <div className="sticky top-16 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
            <nav className="flex gap-6 px-4">
              {artistSettingTabs.map((tab) => {
                const isActive = activeTab === tab.id
                // 아티스트 관리 페이지는 /console/[artistCode]/artist-setting 사용
                const tabHref = `/console/${artistCode}/artist-setting?tab=${tab.id}`
                return (
                  <Link
                    key={tab.id}
                    href={tabHref}
                    className={`relative py-4 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
        <div className="flex-1 flex flex-col min-h-0 overflow-x-hidden w-full max-w-full">
          {children || (
            <div className="flex flex-1 flex-col gap-4 p-4">
              <div className="text-center">
                <h1 className="text-2xl font-semibold">Console</h1>
              </div>
              <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="bg-background aspect-video rounded-xl" />
                <div className="bg-background aspect-video rounded-xl" />
                <div className="bg-background aspect-video rounded-xl" />
              </div>
              <div className="bg-background min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function ConsoleLayout({ user, children }: ConsoleLayoutProps) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    }>
      <ConsoleLayoutContentInner user={user}>{children}</ConsoleLayoutContentInner>
    </Suspense>
  )
}

