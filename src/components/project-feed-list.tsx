"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Plus } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { toast } from "@/lib/toast"
import { CreateFeedDialog } from "./create-feed-dialog"

interface Feed {
  id: string
  project_id: string
  feed_type: 'announcement' | 'workflow' | 'release' | 'calendar' | 'library' | 'member' | 'settings'
  title: string
  content: string | null
  author_id: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  author?: {
    id: string
    nickname: string | null
    full_name: string | null
    avatar_url: string | null
    role?: string | null
  }
}

interface ProjectFeedListProps {
  projectId: string
}

const feedTypeLabels: Record<Feed['feed_type'], string> = {
  announcement: '공지',
  workflow: '워크플로우',
  release: '릴리즈',
  calendar: '캘린더',
  library: '라이브러리',
  member: '멤버',
  settings: '설정',
}

// 데모 피드 데이터
const DEMO_FEEDS: Feed[] = [
  {
    id: 'demo-1',
    project_id: '',
    feed_type: 'announcement',
    title: '앨범 목표 발매일 확정',
    content: 'EP 목표 발매일이 2025-12-20 (토요일)로 확정되었습니다.\n관련 마감일이 조정되었으니 일정에 문제가 있으시면 댓글 부탁드립니다.',
    author_id: 'demo-author-1',
    metadata: {},
    created_at: '2025-10-27T13:22:42Z',
    updated_at: '2025-10-27T13:22:42Z',
    author: {
      id: 'demo-author-1',
      full_name: '이민형',
      nickname: '이민형',
      avatar_url: null,
      role: '리더·세션(기타)',
    },
  },
  {
    id: 'demo-2',
    project_id: '',
    feed_type: 'workflow',
    title: 'Track 02 <Youth Weather> 믹스 피드백 정리본 업로드 (2)',
    content: '<Youth Weather> 믹싱 버전 피드백 정리본을 업로드했습니다.\n@이민행 요청으로 업로드했습니다.',
    author_id: 'demo-author-2',
    metadata: {},
    created_at: '2025-10-28T18:34:10Z',
    updated_at: '2025-10-28T18:34:10Z',
    author: {
      id: 'demo-author-2',
      full_name: '이성환',
      nickname: '이성환',
      avatar_url: null,
      role: '세션(기타)',
    },
  },
  {
    id: 'demo-3',
    project_id: '',
    feed_type: 'release',
    title: '새 유통 제안 도착',
    content: '@이성환 [올림뮤직엔터테인먼트]로부터 새 유통 제안이 도착했습니다.',
    author_id: 'demo-author-3',
    metadata: {},
    created_at: '2025-10-28T17:25:48Z',
    updated_at: '2025-10-28T17:25:48Z',
    author: {
      id: 'demo-author-3',
      full_name: '어바웃나인',
      nickname: '어바웃나인',
      avatar_url: null,
      role: null,
    },
  },
  {
    id: 'demo-4',
    project_id: '',
    feed_type: 'workflow',
    title: '<Youth Weather> 가사 초안 공유 및 피드백 요청 (8)',
    content: '<Youth Weather> 가사 초안을 공유합니다.\n@전체 피드백 부탁드립니다.',
    author_id: 'demo-author-4',
    metadata: {},
    created_at: '2025-10-26T15:47:08Z',
    updated_at: '2025-10-26T15:47:08Z',
    author: {
      id: 'demo-author-4',
      full_name: '황은주',
      nickname: '황은주',
      avatar_url: null,
      role: '보컬',
    },
  },
  {
    id: 'demo-5',
    project_id: '',
    feed_type: 'calendar',
    title: '2025-10-26 14:00 <전체 팀원 회의> 일정 등록 (3)',
    content: '2025-10-26 14:00에 <전체 팀원 회의>가 @전체에게 등록되었습니다.',
    author_id: 'demo-author-3',
    metadata: {},
    created_at: '2025-10-25T10:16:52Z',
    updated_at: '2025-10-25T10:16:52Z',
    author: {
      id: 'demo-author-3',
      full_name: '어바웃나인',
      nickname: '어바웃나인',
      avatar_url: null,
      role: null,
    },
  },
]

export function ProjectFeedList({ projectId }: ProjectFeedListProps) {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [useDemoData, setUseDemoData] = useState(false)

  useEffect(() => {
    loadFeeds()
  }, [projectId])

  const loadFeeds = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // 프로젝트 정보 가져오기 (artist_id 포함)
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('artist_id')
        .eq('id', projectId)
        .maybeSingle()

      if (projectError) {
        console.error("프로젝트 로드 오류:", projectError)
      }

      const artistId = projectData?.artist_id

      // 피드 목록 가져오기
      const { data: feedsData, error: feedsError } = await supabase
        .from('project_feeds')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      // 실제 피드 데이터가 있는지 확인
      const hasRealFeeds = !feedsError && feedsData && feedsData.length > 0
      
      // 사용할 피드 데이터 결정
      const feedsToUse = hasRealFeeds ? feedsData : DEMO_FEEDS.map(feed => ({
        ...feed,
        project_id: projectId,
      }))
      
      setUseDemoData(!hasRealFeeds)

      // 실제 피드 데이터인 경우: 작성자 ID로 프로필 조회
      // 데모 데이터인 경우: 프로젝트 멤버 전체를 가져와서 이름으로 매칭
      
      let profilesMap = new Map()
      let artistMemberRolesMap = new Map<string, string[]>()
      let nameToProfileMap = new Map<string, any>() // 이름으로 프로필 찾기용 (데모 데이터용)
      
      if (hasRealFeeds) {
        // 실제 피드 데이터: 작성자 ID 목록 수집
        const authorIds = [...new Set(feedsToUse.map((feed: any) => feed.author_id))]
        
        // 프로필 정보 가져오기
        if (authorIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, nickname, full_name, avatar_url')
            .in('id', authorIds)

          if (!profilesError && profilesData) {
            profilesMap = new Map(
              profilesData.map(profile => [profile.id, profile])
            )
          }
        }

        // 아티스트 멤버 역할 정보 가져오기
        if (artistId && authorIds.length > 0) {
          const { data: artistMembersData, error: artistMembersError } = await supabase
            .from('artist_members')
            .select(`
              user_id,
              artist_member_roles(
                role:artist_roles(role_name, category)
              )
            `)
            .eq('artist_id', artistId)
            .in('user_id', authorIds)

          if (!artistMembersError && artistMembersData) {
            artistMembersData.forEach((member: any) => {
              const roles = member.artist_member_roles
                ?.map((mr: any) => {
                  const role = mr.role
                  if (!role || !role.role_name) return null
                  // 카테고리는 표시하지 않고 역할명만 사용
                  return role.role_name
                })
                .filter((r: string | null) => r !== null) || []
              
              if (roles.length > 0) {
                artistMemberRolesMap.set(member.user_id, roles)
              }
            })
          }
        }
      } else {
        // 데모 데이터: 프로젝트의 모든 멤버 정보 가져오기
        if (artistId) {
          // 아티스트 멤버 정보 가져오기 (프로필과 역할 포함)
          const { data: artistMembersData, error: artistMembersError } = await supabase
            .from('artist_members')
            .select(`
              user_id,
              artist_member_roles(
                role:artist_roles(role_name, category)
              )
            `)
            .eq('artist_id', artistId)

          if (!artistMembersError && artistMembersData) {
            // 각 멤버의 프로필 정보 조회
            const membersWithProfiles = await Promise.all(
              artistMembersData.map(async (member: any) => {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('id, nickname, full_name, avatar_url')
                  .eq('id', member.user_id)
                  .maybeSingle()

                const roles = member.artist_member_roles
                  ?.map((mr: any) => {
                    const role = mr.role
                    if (!role || !role.role_name) return null
                    // 카테고리는 표시하지 않고 역할명만 사용
                    return role.role_name
                  })
                  .filter((r: string | null) => r !== null) || []

                return {
                  profile: profileData,
                  roles: roles.length > 0 ? roles.join('·') : null,
                }
              })
            )

            // 이름으로 프로필 찾을 수 있도록 맵 생성 (full_name과 nickname 모두 등록)
            membersWithProfiles.forEach((memberInfo: any) => {
              if (memberInfo.profile) {
                const fullName = memberInfo.profile.full_name
                const nickname = memberInfo.profile.nickname
                
                // full_name과 nickname 모두 맵에 등록하여 매칭 확률 높임
                if (fullName) {
                  nameToProfileMap.set(fullName, {
                    ...memberInfo.profile,
                    role: memberInfo.roles,
                  })
                }
                if (nickname && nickname !== fullName) {
                  nameToProfileMap.set(nickname, {
                    ...memberInfo.profile,
                    role: memberInfo.roles,
                  })
                }
              }
            })
          }
        }
      }

      // 피드 데이터에 프로필 정보와 아티스트 멤버 역할 정보 결합
      const feedsWithAuthors = feedsToUse.map((feed: any) => {
        if (hasRealFeeds) {
          // 실제 피드 데이터: author_id로 프로필 찾기
          const profile = profilesMap.get(feed.author_id)
          const roles = artistMemberRolesMap.get(feed.author_id) || []
          const roleString = roles.length > 0 ? roles.join('·') : null
          
          return {
            ...feed,
            author: profile ? {
              ...profile,
              role: roleString,
            } : null,
          }
        } else {
          // 데모 피드 데이터: 이름으로 프로필 찾기
          const demoAuthorName = feed.author?.full_name || feed.author?.nickname
          const realProfile = demoAuthorName ? nameToProfileMap.get(demoAuthorName) : null
          
          return {
            ...feed,
            author: realProfile || feed.author, // 실제 프로필이 있으면 사용, 없으면 데모 데이터 유지
          }
        }
      })

      setFeeds(feedsWithAuthors)
    } catch (err) {
      console.error("피드 로드 실패:", err)
      // 에러 발생 시 데모 데이터 사용하되 프로필 정보는 실제 멤버로 교체
      try {
        const supabase = createClient()
        
        // 프로젝트 정보 가져오기
        const { data: projectData } = await supabase
          .from('projects')
          .select('artist_id')
          .eq('id', projectId)
          .maybeSingle()

        const artistId = projectData?.artist_id

        // 데모 피드 데이터 준비
        const demoFeeds = DEMO_FEEDS.map(feed => ({
          ...feed,
          project_id: projectId,
        }))

        // 실제 멤버 정보로 프로필 교체
        if (artistId) {
          const { data: artistMembersData } = await supabase
            .from('artist_members')
            .select(`
              user_id,
              artist_member_roles(
                role:artist_roles(role_name, category)
              )
            `)
            .eq('artist_id', artistId)

          if (artistMembersData) {
            const nameToProfileMap = new Map()
            
            for (const member of artistMembersData) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('id, nickname, full_name, avatar_url')
                .eq('id', member.user_id)
                .maybeSingle()

              if (profileData) {
                const roles = member.artist_member_roles
                  ?.map((mr: any) => {
                    const role = mr.role
                    if (!role || !role.role_name) return null
                    // 카테고리는 표시하지 않고 역할명만 사용
                    return role.role_name
                  })
                  .filter((r: string | null) => r !== null) || []

                const fullName = profileData.full_name
                const nickname = profileData.nickname
                
                // full_name과 nickname 모두 맵에 등록하여 매칭 확률 높임
                if (fullName) {
                  nameToProfileMap.set(fullName, {
                    ...profileData,
                    role: roles.length > 0 ? roles.join('·') : null,
                  })
                }
                if (nickname && nickname !== fullName) {
                  nameToProfileMap.set(nickname, {
                    ...profileData,
                    role: roles.length > 0 ? roles.join('·') : null,
                  })
                }
              }
            }

            // 데모 피드의 프로필 교체
            const feedsWithRealProfiles = demoFeeds.map((feed: any) => {
              const demoAuthorName = feed.author?.full_name || feed.author?.nickname
              const realProfile = demoAuthorName ? nameToProfileMap.get(demoAuthorName) : null
              
              return {
                ...feed,
                author: realProfile || feed.author,
              }
            })

            setFeeds(feedsWithRealProfiles)
            setUseDemoData(true)
            return
          }
        }

        // 멤버 정보를 가져올 수 없으면 데모 데이터 그대로 사용
        setFeeds(demoFeeds)
        setUseDemoData(true)
      } catch (profileErr) {
        console.error("프로필 교체 실패:", profileErr)
        // 프로필 교체 실패해도 데모 데이터는 표시
        const demoFeeds = DEMO_FEEDS.map(feed => ({
          ...feed,
          project_id: projectId,
        }))
        setFeeds(demoFeeds)
        setUseDemoData(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFeedCreated = () => {
    loadFeeds()
    setIsCreateDialogOpen(false)
  }

  const getAuthorName = (feed: Feed) => {
    if (feed.author?.full_name) return feed.author.full_name
    if (feed.author?.nickname) return feed.author.nickname
    return "알 수 없음"
  }

  const getAuthorInitials = (feed: Feed) => {
    const name = getAuthorName(feed)
    if (name === "알 수 없음") return "??"
    return name.slice(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">피드</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          게시물 작성
        </Button>
      </div>

      {/* 피드 목록 */}
      {feeds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">아직 게시물이 없습니다</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            첫 게시물 작성하기
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {feeds.map((feed) => (
            <Card key={feed.id} className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-4 pt-4">
                <div className="flex flex-col gap-4">
                  {/* 제목과 내용 */}
                  <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-base leading-tight mt-1">
                      <span className="text-primary">
                        {feedTypeLabels[feed.feed_type]} |{' '}
                      </span>
                      {feed.title}
                    </h3>
                    {feed.content && (
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {feed.content}
                      </p>
                    )}
                  </div>
                  
                  {/* 프로필 정보 (하단) */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={feed.author?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{getAuthorInitials(feed)}</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{getAuthorName(feed)}</span>
                        {feed.author?.role && (
                          <span className="text-sm text-muted-foreground">
                            {' '}{feed.author.role}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {format(new Date(feed.created_at), "yyyy-MM-dd HH:mm:ss", { locale: ko })}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* 게시물 작성 다이얼로그 */}
      <CreateFeedDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projectId={projectId}
        onSuccess={handleFeedCreated}
      />
    </div>
  )
}

