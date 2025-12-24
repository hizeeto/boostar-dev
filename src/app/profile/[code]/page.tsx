"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Users, UserPlus, Music, Instagram, Youtube, FileText } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { toast } from "@/lib/toast"

interface ProfileData {
  id: string
  email: string | null
  nickname: string | null
  full_name: string | null
  bio: string | null
  phone: string | null
  birthdate: string | null
  gender: "male" | "female" | "none" | null
  address1: string | null
  address2: string | null
  zip_code: string | null
  avatar_url: string | null
  unique_code: string
  member_type: "consumer" | "expert" | "business"
  created_at: string
  sns?: Record<string, string> | null
}

interface ArticleCardProps {
  article: {
    category: string
    title: string
    fileName: string | null
    id: string
    publishedDate?: string
  }
  thumbnailUrl: string | null
  profileCode: string
}

function ArticleCard({ article, thumbnailUrl, profileCode }: ArticleCardProps) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  
  const handleClick = () => {
    router.push(`/profile/${profileCode}/article/${article.id}`)
  }
  
  return (
    <Card 
      className="overflow-hidden p-0 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      {/* 썸네일 이미지 (16:9 비율) */}
      <div className="w-full aspect-video bg-muted overflow-hidden relative">
        {thumbnailUrl && !imageError ? (
          <img
            src={thumbnailUrl}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
      </div>
      {/* 아티클 정보 */}
      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-2">{article.category}</p>
        <h4 className="font-medium text-base md:text-lg mb-2">{article.title}</h4>
        {article.publishedDate && (
          <p className="text-sm text-muted-foreground">
            {format(new Date(article.publishedDate), "yyyy-MM-dd", { locale: ko })}
          </p>
        )}
      </div>
    </Card>
  )
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = params.code as string
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState<"discography" | "articles">(
    tabParam === "articles" ? "articles" : "discography"
  )
  const supabase = createClient()

  // URL 파라미터가 변경되면 탭 업데이트
  useEffect(() => {
    if (tabParam === "articles") {
      setActiveTab("articles")
    } else if (tabParam === "discography" || !tabParam) {
      setActiveTab("discography")
    }
  }, [tabParam])
  
  // 디스코그래피 이미지 URL 생성 함수
  const getAlbumImageUrl = (fileName: string) => {
    const imagePath = `discography/${fileName}`
    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(imagePath)
    return data.publicUrl
  }

  // 아티클 썸네일 이미지 URL 생성 함수
  const getArticleThumbnailUrl = (fileName: string) => {
    const imagePath = `thumbnail/${fileName}`
    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(imagePath)
    return data.publicUrl
  }

  useEffect(() => {
    if (code) {
      loadProfile()
    }
  }, [code])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("unique_code", code.toUpperCase())
        .single()

      // SNS 정보가 없으면 데모 데이터 사용
      if (data && !data.sns) {
        data.sns = {
          instagram: "https://instagram.com/aboutnine",
          youtube: "https://youtube.com/@aboutnine",
          soundcloud: "https://soundcloud.com/aboutnine"
        }
      }

      if (profileError) {
        console.error("프로필 로드 오류:", profileError)
        if (profileError.code === "PGRST116") {
          setError("프로필을 찾을 수 없습니다")
        } else {
          setError("프로필을 불러오는 중 오류가 발생했습니다")
        }
        return
      }

      if (!data) {
        setError("프로필을 찾을 수 없습니다")
        return
      }

      setProfile(data as ProfileData)
    } catch (err) {
      console.error("프로필 로드 중 예외:", err)
      setError("프로필을 불러오는 중 오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  const getDisplayName = () => {
    if (!profile) return "사용자"
    return profile.full_name || profile.nickname || "이름 없음"
  }

  const getBackgroundImage = () => {
    if (profile?.avatar_url) {
      return profile.avatar_url
    }
    // 기본 그라데이션 배경
    return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <p className="text-muted-foreground">프로필을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4 text-center">{error || "프로필이 존재하지 않습니다"}</p>
            <Button onClick={() => router.push("/")} variant="outline" className="w-full">
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const backgroundImage = getBackgroundImage()
  const isImageUrl = backgroundImage.startsWith('http') || backgroundImage.startsWith('/')

  return (
    <div className="min-h-screen bg-muted/30">
      {/* 프로필 카드 - 전체 너비 */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div
          className="relative h-[700px] md:h-[800px] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: isImageUrl 
              ? `url(${backgroundImage})` 
              : backgroundImage,
          }}
        >
          {/* 반투명 오버레이 (하단) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
          
          {/* 프로필 정보 (하단에 배치) */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
            {/* 이름과 인증 배지 */}
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl md:text-4xl font-bold">{getDisplayName()}</h1>
              {profile.member_type === "expert" && (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500">
                  <span 
                    className="w-4 h-4 inline-block bg-white"
                    style={{
                      WebkitMaskImage: `url(/assets/verified-user.svg)`,
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskImage: `url(/assets/verified-user.svg)`,
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                    }}
                  />
                </div>
              )}
            </div>

            {/* 소개 */}
            {profile.bio && (
              <p className="text-white/90 text-base md:text-lg mb-6 max-w-2xl">
                {profile.bio}
              </p>
            )}

            {/* 통계 정보 */}
            <div className="flex flex-wrap gap-6 md:gap-8 mb-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-white/80" />
                <span className="text-lg font-semibold">22.2k</span>
                <span className="text-white/70 text-sm">팔로워</span>
              </div>
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-white/80" />
                <span className="text-lg font-semibold">500</span>
                <span className="text-white/70 text-sm">팔로잉</span>
              </div>
            </div>

            {/* SNS 바로가기 */}
            {(profile.sns?.instagram || profile.sns?.youtube || profile.sns?.soundcloud) && (
              <div className="flex items-center gap-4 mb-6">
                {profile.sns.instagram && (
                  <a
                    href={profile.sns.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/90 hover:text-white transition-colors"
                  >
                    <Instagram className="h-6 w-6" />
                  </a>
                )}
                {profile.sns.youtube && (
                  <a
                    href={profile.sns.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/90 hover:text-white transition-colors"
                  >
                    <Youtube className="h-6 w-6" />
                  </a>
                )}
                {profile.sns.soundcloud && (
                  <a
                    href={profile.sns.soundcloud}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/90 hover:text-white transition-colors"
                  >
                    <Music className="h-6 w-6" />
                  </a>
                )}
              </div>
            )}

            {/* 소개글 */}
            <div className="mb-6">
              <p className="text-white/90 text-base md:text-lg max-w-2xl leading-relaxed">
                어바웃나인의 리더이자 기타리스트로, 기타 톤과 리듬의 결을 설계해 밴드의 중심 그루브를 만든다. 라이브에서는 곡의 에너지를 끌어올리고, 작업에서는 편곡의 흐름과 다이내믹을 정교하게 다듬는다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 디스코그래피 & 아티클 탭 */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* 탭 메뉴 */}
        <div className="border-b mb-6">
          <nav className="flex gap-6">
            <button
              onClick={() => {
                setActiveTab("discography")
                router.push(`/profile/${code}?tab=discography`, { scroll: false })
              }}
              className={`relative py-4 text-sm font-medium transition-colors ${
                activeTab === "discography"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              디스코그래피
              {activeTab === "discography" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("articles")
                router.push(`/profile/${code}?tab=articles`, { scroll: false })
              }}
              className={`relative py-4 text-sm font-medium transition-colors ${
                activeTab === "articles"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              아티클
              {activeTab === "articles" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
          </nav>
        </div>

        {/* 디스코그래피 탭 컨텐츠 */}
        {activeTab === "discography" && (
          <div className="space-y-4">
            {[
              { title: "유리의 낮", releaseDate: "2025-10-18", fileName: "2151004971.jpg" },
              { title: "초점 밖의 사람들", releaseDate: "2025-05-09", fileName: "2151004976.jpg" },
              { title: "네온의 끝", releaseDate: "2024-11-22", fileName: "274.jpg" },
              { title: "파도선", releaseDate: "2024-07-14", fileName: "11398546.jpg" },
              { title: "낮잠의 도시", releaseDate: "2023-03-17", fileName: "5290.jpg" },
            ].map((album, index) => {
              const date = new Date(album.releaseDate)
              const formattedDate = format(date, "yyyy-MM-dd", { locale: ko })
              const imageUrl = getAlbumImageUrl(album.fileName)
              
              return (
                <Card key={index} className="overflow-hidden p-0">
                  <div className="flex">
                    {/* 앨범 커버 이미지 - 카드 왼쪽 끝에 붙이고 높이 꽉 채움 */}
                    <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-muted overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={album.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // 이미지 로드 실패 시 기본 배경 표시
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    </div>
                    {/* 앨범 정보 - 텍스트 영역만 padding */}
                    <div className="flex-1 flex flex-col justify-center p-4">
                      <h4 className="font-medium text-base md:text-lg mb-1">{album.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formattedDate}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* 아티클 탭 컨텐츠 */}
        {activeTab === "articles" && (
          <div className="space-y-4">
            {[
              { id: "1", category: "앨범 노트", title: "<유리창의 온도>는 왜 '온도'인가", fileName: "3188.jpg", publishedDate: "2025-10-18" },
              { id: "2", category: "트랙 코멘터리", title: "'미지근한 새벽' 8마디에서 시작된 훅", fileName: "42652.jpg", publishedDate: "2025-08-25" },
              { id: "3", category: "작업기", title: "기타 톤을 '반투명'하게 만드는 3가지 레이어", fileName: "403858.jpg", publishedDate: "2025-07-16" },
              { id: "4", category: "인터뷰", title: "합주에서 가장 중요한 건 '간격'", fileName: "9941285.jpg", publishedDate: "2025-07-02" },
              { id: "5", category: "플레이리스트 노트", title: "멤버들이 반복 재생한 9곡", fileName: "1081876.jpg", publishedDate: "2025-06-27" },
            ].map((article, index) => {
              const thumbnailUrl = article.fileName ? getArticleThumbnailUrl(article.fileName) : null
              
              return (
                <ArticleCard
                  key={index}
                  article={article}
                  thumbnailUrl={thumbnailUrl}
                  profileCode={code}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
