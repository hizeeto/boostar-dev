"use client"

import { RollingBanner } from "@/components/rolling-banner"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

// 배너 이미지 URL 생성 함수
function getBannerImageUrl(fileName: string): string {
  const supabase = createClient()
  const imagePath = `main-banner/${fileName}`
  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(imagePath)
  return data.publicUrl
}

// 앨범 이미지 URL 생성 함수
function getAlbumImageUrl(fileName: string): string {
  const supabase = createClient()
  const imagePath = `discography/${fileName}`
  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(imagePath)
  return data.publicUrl
}

// 아티클 썸네일 이미지 URL 생성 함수
function getArticleThumbnailUrl(fileName: string): string {
  const supabase = createClient()
  const imagePath = `thumbnail/${fileName}`
  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(imagePath)
  return data.publicUrl
}

// 커버 이미지 URL 생성 함수
function getCoverImageUrl(fileName: string): string {
  const supabase = createClient()
  const imagePath = `cover-images/${fileName}`
  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(imagePath)
  return data.publicUrl
}

// 아티스트 이미지 URL 생성 함수
function getArtistImageUrl(fileName: string): string {
  const supabase = createClient()
  const imagePath = `artist-images/${fileName}`
  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(imagePath)
  return data.publicUrl
}

const latestAlbums = [
  {
    id: "1",
    title: "유리의 낮",
    artist: "어바웃나인",
    imageUrl: getAlbumImageUrl("2151004971.jpg"),
  },
  {
    id: "2",
    title: "초점 밖의 사람들",
    artist: "하린",
    imageUrl: getAlbumImageUrl("2151004976.jpg"),
  },
  {
    id: "3",
    title: "네온의 끝",
    artist: "어바웃나인",
    imageUrl: getAlbumImageUrl("274.jpg"),
  },
  {
    id: "4",
    title: "파도선",
    artist: "박도현",
    imageUrl: getAlbumImageUrl("11398546.jpg"),
  },
  {
    id: "5",
    title: "낮잠의 도시",
    artist: "아이크",
    imageUrl: getAlbumImageUrl("5290.jpg"),
  },
  {
    id: "6",
    title: "낮은 행성",
    artist: "은채",
    imageUrl: getAlbumImageUrl("9647.jpg"),
  },
]

const latestArticles = [
  {
    id: "1",
    title: "유통사 제안 비교, 무엇을 먼저 봐야 하나",
    publishedDate: "2055-11-02",
    imageUrl: getArticleThumbnailUrl("17292724.jpg"),
  },
  {
    id: "2",
    title: "<유리창의 온도>는 왜 '온도'인가",
    publishedDate: "2025-10-18",
    imageUrl: getArticleThumbnailUrl("3188.jpg"),
  },
  {
    id: "3",
    title: "검수에서 가장 자주 터지는 7가지 이슈",
    publishedDate: "2025-09-26",
    imageUrl: getArticleThumbnailUrl("37460.jpg"),
  },
  {
    id: "4",
    title: "정산서 읽는 법: 누락·이상치 5분 점검",
    publishedDate: "2025-09-08",
    imageUrl: getArticleThumbnailUrl("2149241314.jpg"),
  },
  {
    id: "5",
    title: "'미지근한 새벽' 8마디에서 시작된 훅",
    publishedDate: "2025-08-25",
    imageUrl: getArticleThumbnailUrl("42652.jpg"),
  },
  {
    id: "6",
    title: "기타 톤을 '반투명'하게 만드는 3가지 레이어",
    publishedDate: "2025-07-16",
    imageUrl: getArticleThumbnailUrl("403858.jpg"),
  },
  {
    id: "7",
    title: "팀 작업 버전 지옥 탈출: 파일·피드백 정리 루틴",
    publishedDate: "2025-07-12",
    imageUrl: getArticleThumbnailUrl("2149272013.jpg"),
  },
  {
    id: "8",
    title: "합주에서 가장 중요한 건 '간격'",
    publishedDate: "2025-07-02",
    imageUrl: getArticleThumbnailUrl("9941285.jpg"),
  },
  {
    id: "9",
    title: "멤버들이 반복 재생한 9곡",
    publishedDate: "2025-06-27",
    imageUrl: getArticleThumbnailUrl("1081876.jpg"),
  },
]

const bannerItems = [
  {
    id: "1",
    title: "이번 주 마감, 한 화면에서 끝내기",
    subtitle: "이번 주 마감된 릴리즈·계약·정산·외주 작업을 한 번에 확인하고, 오늘 할 일부터 정리하세요.",
    imageUrl: getBannerImageUrl("11816.jpg"),
    backgroundColor: "#e0e7ff",
  },
  {
    id: "2",
    title: "릴리즈 준비도 점검하기",
    subtitle: "신청 폼, 검수/보완, 발매일 확정, 메타데이터까지. 누락된 항목만 자동으로 콕 집어줍니다.",
    imageUrl: getBannerImageUrl("2125.jpg"),
    backgroundColor: "#f3f4f6",
  },
  {
    id: "3",
    title: "유통사 제안 비교, 결정은 더 빠르게",
    subtitle: "수수료, 정산 주기, 제공 서비스, 커뮤니케이션 기록을 나란히 비교하고 지금 바로 선택하세요.",
    imageUrl: getBannerImageUrl("4498.jpg"),
    backgroundColor: "#fef3c7",
  },
  {
    id: "4",
    title: "계약·정산 리스크, 미리 막기",
    subtitle: "계약 상태, 정산서 도착 여부, 수익 분배 이슈를 알림으로 선제 대응합니다.",
    imageUrl: getBannerImageUrl("54661.jpg"),
    backgroundColor: "#dbeafe",
  },
  {
    id: "5",
    title: "팀 작업, '버전' 대신 '흐름'으로",
    subtitle: "파일·피드백·채팅을 작업 카드에 묶어두면, \"최신본이 뭐지?\"에서 해방됩니다.",
    imageUrl: getBannerImageUrl("200726.jpg"),
    backgroundColor: "#fce7f3",
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 overflow-x-hidden w-full max-w-full">
      {/* 롤링 배너 */}
      <RollingBanner items={bannerItems} autoPlayInterval={5000} />
      
      {/* 최신 앨범 섹션 */}
      <div className="flex flex-col gap-4 mt-8">
        <h2 className="text-xl font-semibold">최신 앨범</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {latestAlbums.map((album) => (
            <Card key={album.id} className="overflow-hidden p-0 border-0 shadow-none">
              {/* 이미지 - 여백 없이 꽉 차게, radius 적용 */}
              <div className="w-full aspect-square bg-muted overflow-hidden rounded-lg">
                <img
                  src={album.imageUrl}
                  alt={album.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
              {/* 제목/아티스트 - 상하 배치 */}
              <div className="px-1 py-3">
                <h3 className="font-medium text-base mb-1 line-clamp-1">{album.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{album.artist}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      {/* 이달의 아티스트 섹션 */}
      <div className="flex flex-col gap-4 mt-8">
        <Card className="bg-gray-50 p-6 border-0">
          <div className="flex gap-8 items-stretch">
            {/* 좌측: 텍스트 영역 */}
            <div className="flex-1 flex flex-col gap-6 max-w-[50%] justify-between">
              <h2 className="text-xl font-semibold">이달의 아티스트</h2>
              
              <div className="flex flex-col gap-6 mt-auto">
                {/* 아티스트 정보 */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img
                      src={getArtistImageUrl("harin.png")}
                      alt="하린"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = '<span class="text-white text-2xl font-bold">H</span>'
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-semibold">HARIN</h3>
                    <p className="text-lg font-medium">하린</p>
                  </div>
                </div>
                
                {/* 설명 문단 */}
                <div className="flex flex-col gap-4 text-base leading-relaxed text-muted-foreground">
                  <p>
                    하린(HARIN)은 낮은 톤의 보컬과 담담한 문장으로 감정의 결을 촘촘히 기록하는 싱어송라이터다. 크게 흔들리기보다, 사소한 흔들림이 남기는 잔향을 따라가며 일상의 순간들을 노래로 번역한다. 멜로디는 단정하고, 편곡은 필요한 만큼만 남겨 보컬의 숨과 여백이 곡의 중심이 된다.
                  </p>
                  <p>
                    작업은 대개 짧은 문장 한 줄에서 시작한다. '말을 아낄수록 더 선명해지는 것들'을 붙잡아, 반복되는 생활 속 미묘한 변화를 섬세하게 쌓아 올린다. 하린의 노래는 과장된 위로 대신, 감정을 있는 그대로 놓아두는 방식으로 듣는 사람의 하루에 조용히 스며든다.
                  </p>
                </div>
              </div>
            </div>
            
            {/* 우측: 이미지 영역 */}
            <div className="flex-1 flex items-stretch">
              <div className="w-full bg-white rounded-lg overflow-hidden">
                <img
                  src={getCoverImageUrl("46773.jpg")}
                  alt="이달의 아티스트"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* 최신 아티클 섹션 */}
      <div className="flex flex-col gap-4 mt-8">
        <h2 className="text-xl font-semibold">최신 아티클</h2>
        <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4">
            {latestArticles.map((article) => (
              <Card key={article.id} className="overflow-hidden p-0 border-0 shadow-none flex-shrink-0" style={{ width: "280px" }}>
                {/* 이미지 - 16:9 비율, 여백 없이 꽉 차게, radius 적용 */}
                <div className="w-full aspect-video bg-muted overflow-hidden rounded-lg">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
                {/* 제목/발행일 - 상하 배치 */}
                <div className="px-1 py-3">
                  <h3 className="font-medium text-base mb-1 line-clamp-2">{article.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(article.publishedDate), "yyyy-MM-dd", { locale: ko })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

