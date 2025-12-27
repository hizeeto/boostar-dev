"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  AudioWaveform,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Folder,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { ArtistSwitcher } from "@/components/artist-switcher"
import { SearchDialog } from "@/components/search-dialog"
import { NotificationDialog } from "@/components/notification-dialog"
import { type ProjectColor } from "@/hooks/use-projects"
import { useProjectsContext } from "@/hooks/use-projects-context"
import { useArtistContext } from "@/hooks/use-artist-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const defaultData = {
  user: {
    name: "User",
    email: "",
    avatar: "",
  },
}

const getNavMainItems = (
  pathname: string, 
  artistCode: string | null,
  onSearchClick?: () => void,
  onNotificationClick?: () => void
) => {
  // artistCode가 없으면 빈 문자열로 처리 (나중에 리다이렉트될 것)
  const baseUrl = artistCode ? `/console/${artistCode}` : "/console"
  
  return [
    {
      title: "검색",
      url: "#",
      icon: "/assets/search.svg",
      isActive: false,
      disabled: false,
      onClick: onSearchClick,
    },
    {
      title: "홈",
      url: artistCode ? `${baseUrl}/home` : "#",
      icon: "/assets/home.svg",
      isActive: pathname.includes("/home"),
    },
    {
      title: "알림",
      url: "#",
      icon: "/assets/alert.svg",
      isActive: false,
      disabled: false,
      onClick: onNotificationClick,
    },
    {
      title: "메시지",
      url: artistCode ? `${baseUrl}/messages` : "#",
      icon: "/assets/email.svg",
      isActive: pathname.includes("/messages"),
    },
    {
      title: "아티스트 스페이스 관리",
      url: artistCode ? `${baseUrl}/artist-setting` : "#",
      icon: "/assets/person.svg",
      isActive: pathname.includes("/artist-setting"),
    },
    {
      title: "프로젝트",
      url: artistCode ? `${baseUrl}/projects` : "#",
      icon: "/assets/folder.svg",
      isActive: pathname.includes("/projects"),
    },
  ]
}

const getExploreItems = () => [
  {
    title: "마켓",
    url: "#",
    icon: "/assets/storefront.svg",
    isActive: false,
    disabled: true,
  },
  {
    title: "공모전",
    url: "#",
    icon: "/assets/emoji_events.svg",
    isActive: false,
    disabled: true,
  },
  {
    title: "플레이스",
    url: "#",
    icon: "/assets/place.svg",
    isActive: false,
    disabled: true,
  },
  {
    title: "콘텐츠·커뮤니티",
    url: "#",
    icon: "/assets/article.svg",
    isActive: false,
    disabled: true,
  },
]

export function AppSidebar({ 
  user,
  ...props 
}: React.ComponentProps<typeof Sidebar> & {
  user?: {
    name: string
    email: string
    avatar: string
  }
}) {
  const pathname = usePathname()
  const userData = user || defaultData.user
  const { activeArtist } = useArtistContext()
  const [isSearchDialogOpen, setIsSearchDialogOpen] = React.useState(false)
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = React.useState(false)
  
  // activeArtist에서 artistCode 가져오기 (URL보다 우선)
  // URL에서도 추출 시도 (사용자 프로필 페이지 등에서 사용)
  const pathSegments = pathname.split('/')
  const urlArtistCode = pathSegments[1] === 'console' && pathSegments[2] ? pathSegments[2] : null
  const artistCode = activeArtist?.artist_code || urlArtistCode
  
  const handleSearchClick = React.useCallback(() => {
    setIsSearchDialogOpen(true)
  }, [])

  const handleNotificationClick = React.useCallback(() => {
    setIsNotificationDialogOpen(true)
  }, [])
  
  const navMainItems = getNavMainItems(
    pathname, 
    artistCode, 
    handleSearchClick,
    handleNotificationClick
  )
  const exploreItems = getExploreItems()
  const { projects, loading } = useProjectsContext()

  // 프로젝트 데이터를 NavProjects 형식으로 변환 (고정된 프로젝트만)
  const projectItems = React.useMemo(() => {
    const baseUrl = artistCode ? `/console/${artistCode}` : "/console"
    const items = projects
      .filter((project) => project.is_pinned)
      .map((project) => {
        const codeOrId = project.project_code || project.id
        const url = artistCode ? `${baseUrl}/projects/${codeOrId}` : "#"
        
        console.log("[사이드바] 프로젝트 URL 생성:", {
          projectId: project.id,
          projectName: project.name,
          projectCode: project.project_code,
          codeOrId,
          url
        })
        
        return {
          id: project.id,
          name: project.name,
          url,
          color: project.color || 'purple',
        }
      })
    
    return items
  }, [projects, artistCode])

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <ArtistSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navMainItems} />
          <NavMain items={exploreItems} label="탐색" />
          {!loading && <NavProjects projects={projectItems} />}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={userData} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SearchDialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen} />
      <NotificationDialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen} />
    </>
  )
}
