"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import { toast } from "@/lib/toast"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

// 아티클 데이터 (임시 - 나중에 DB에서 가져올 수 있음)
const ARTICLES = [
  { 
    id: "1", 
    category: "앨범 노트", 
    title: "<유리창의 온도>는 왜 '온도'인가", 
    fileName: "3188.jpg",
    publishedDate: "2025-10-18",
    content: `유리창은 늘 경계에 있다. 안과 밖을 나누면서도, 빛과 소리, 기척 같은 것들은 조금씩 통과시킨다. 완전히 차단하지도, 완전히 열어젖히지도 못하는 얇은 막. 이번 EP <유리창의 온도>에서 우리가 '온도'를 꺼낸 이유는 그 경계의 감각을 가장 정확하게 설명하는 단어가 온도였기 때문이다.

감정은 대개 말보다 먼저 피부에 닿는다. 누군가와의 거리가 가까워질 때, 혹은 멀어질 때 우리는 "차갑다", "따뜻하다" 같은 표현을 자연스럽게 쓴다. 그건 감정을 온도로 인지한다는 뜻이기도 하다. 뜨거워서 다가가는 것도 아니고, 차가워서 물러나는 것도 아닌 애매한 순간들(마치 손을 대면 식지 않은 잔열이 남아 있는 유리창처럼), 우리는 그 중간 지점을 오래 지나왔다. 그 중간의 감각을 기록하려면 '감정'보다 '온도'가 더 정직했다.

유리창이라는 소재는 '거리감'을 전제한다. 창을 사이에 두면 우리는 서로를 볼 수 있지만 만질 수는 없다. 가까이 있어도 닿지 않는 관계, 같은 공간에 있어도 분리된 마음, 메시지는 오가지만 체온은 전달되지 않는 시간. 그러니까 이 EP에서 유리창은 단순한 이미지가 아니라, 관계의 구조를 설명하는 장치다. 보이는 것과 닿는 것의 차이, 그 차이를 견디는 시간의 결이 곧 '온도'로 남는다.

우리가 말하는 '온도'는 극단의 감정이 아니다. 불타오르는 사랑도, 얼어붙은 단절도 아니다. 오히려 일상에서 더 자주 마주치는, 미지근함에 가깝다. 확신이 부족한 채로 이어지는 대화, 끊어야 하는 걸 알면서도 미루는 인사, 그럼에도 완전히 떠나지 못하고 창가에 머무는 마음. 이 EP의 타이틀곡이 '미지근한 새벽'인 이유도 여기에 있다. 새벽은 하루가 바뀌는 경계이고, 미지근함은 마음이 결론을 내리지 못한 상태다. 경계 위의 상태를 가장 정확히 말하는 방식이 "미지근하다"였다.

사운드도 같은 방향을 바라본다. 이 EP는 과하게 밀어붙이지 않는다. 리듬은 과잉의 속도를 피하고, 보컬은 감정을 크게 부풀리기보다 한 발 떨어진 거리에서 말한다. 대신, 잔향과 공기감으로 공간을 만든다. 유리창 너머의 방처럼, 소리는 바로 앞에 있는 듯하지만 손을 뻗으면 닿지 않는 위치에 놓인다. 따뜻한 코드 진행이 나오다가도, 어느 순간 차가운 신스가 스치고 지나가며 온도를 흔든다. 그 변화가 곡들의 핵심 드라마다. 감정의 사건이 아니라, 온도의 변주가 이야기를 끌고 간다.

트랙들은 각기 다른 온도의 순간을 포착한다. '초점 밖의 사람들'은 가까운 듯 멀어진 관계를, '흐릿한 문자'는 말이 남긴 잔열을, '너의 거리감'은 서로가 거리를 조정하는 방식의 차이를 담는다. 중요한 건 사건의 크기가 아니라, 그 사건이 남긴 체감이다. 어떤 날은 분명히 별일 없었는데도 마음이 차갑고, 어떤 날은 아무 말도 하지 않았는데도 이상하게 따뜻하다. 그 이유를 우리는 논리로 설명하기보다, 온도로 기록하고 싶었다.

결국 <유리창의 온도>는 "이 관계는 무엇인가"보다 "이 관계는 어떤 감각으로 남았는가"를 묻는 EP다. 유리창은 우리에게 가장 현실적인 비유였다. 완전히 닫힌 벽도 아니고, 완전히 열린 문도 아닌 것. 우리의 관계도, 우리의 밤도, 우리의 대화도 늘 그 중간 어디쯤에 있었다. 그 중간의 감각이 손끝에 남았을 때, 우리는 그것을 온도라고 불렀다.

이 EP를 듣는 동안, 각자의 창을 떠올려도 좋겠다. 한때 자주 기대었던 창, 누군가와 나눈 말의 잔열이 아직 남아 있는 창, 혹은 차가운 공기가 스며들던 창. 중요한 건 유리창이 아니라 그 너머다. 우리가 붙잡고 싶었던 건, 결국 당신 마음에 남아 있는 '그때의 온도'였다.`
  },
  { id: "2", category: "트랙 코멘터리", title: "'미지근한 새벽' 8마디에서 시작된 훅", fileName: "42652.jpg", publishedDate: "2025-08-25", content: "본문 내용이 여기에 들어갑니다..." },
  { id: "3", category: "작업기", title: "기타 톤을 '반투명'하게 만드는 3가지 레이어", fileName: "403858.jpg", publishedDate: "2025-07-16", content: "본문 내용이 여기에 들어갑니다..." },
  { id: "4", category: "인터뷰", title: "합주에서 가장 중요한 건 '간격'", fileName: "9941285.jpg", publishedDate: "2025-07-02", content: "본문 내용이 여기에 들어갑니다..." },
  { id: "5", category: "플레이리스트 노트", title: "멤버들이 반복 재생한 9곡", fileName: "1081876.jpg", publishedDate: "2025-06-27", content: "본문 내용이 여기에 들어갑니다..." },
]

export default function ArticleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const articleId = params.articleId as string
  const supabase = createClient()
  
  const [article, setArticle] = useState<typeof ARTICLES[0] | null>(null)
  const [loading, setLoading] = useState(true)

  // 아티클 썸네일 이미지 URL 생성 함수
  const getArticleThumbnailUrl = (fileName: string) => {
    const imagePath = `thumbnail/${fileName}`
    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(imagePath)
    return data.publicUrl
  }

  useEffect(() => {
    if (articleId) {
      // 임시로 로컬 데이터에서 찾기 (나중에 DB에서 가져올 수 있음)
      const foundArticle = ARTICLES.find(a => a.id === articleId)
      if (foundArticle) {
        setArticle(foundArticle)
      }
      setLoading(false)
    }
  }, [articleId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <p className="text-muted-foreground">아티클을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md p-6">
          <p className="text-muted-foreground mb-4 text-center">아티클을 찾을 수 없습니다</p>
          <Button onClick={() => router.push(`/profile/${code}`)} variant="outline" className="w-full">
            프로필로 돌아가기
          </Button>
        </Card>
      </div>
    )
  }

  const thumbnailUrl = getArticleThumbnailUrl(article.fileName)
  const currentIndex = ARTICLES.findIndex(a => a.id === articleId)
  const prevArticle = currentIndex > 0 ? ARTICLES[currentIndex - 1] : null
  const nextArticle = currentIndex < ARTICLES.length - 1 ? ARTICLES[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 헤더 - 썸네일 배경 */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div
          className="relative h-[400px] md:h-[500px] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${thumbnailUrl})`,
          }}
        >
          {/* 딤드 오버레이 */}
          <div className="absolute inset-0 bg-black/60" />
          
          {/* 뒤로가기 버튼 */}
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/profile/${code}?tab=articles`)}
              className="text-white hover:bg-white/10 border-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          
          {/* 카테고리와 제목 */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
            <p className="text-sm md:text-base text-white/80 mb-3">{article.category}</p>
            <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-3">{article.title}</h1>
            {article.publishedDate && (
              <p className="text-sm md:text-base text-white/70">
                {format(new Date(article.publishedDate), "yyyy-MM-dd", { locale: ko })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 본문 섹션 */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <p className="text-base md:text-lg leading-relaxed whitespace-pre-line">
            {article.content}
          </p>
        </div>
      </div>

      {/* 이전글/다음글 */}
      <div className="container mx-auto px-6 py-12 max-w-4xl border-t">
        <div className="space-y-0">
          {/* 이전글 */}
          {prevArticle ? (
            <button
              onClick={() => router.push(`/profile/${code}/article/${prevArticle.id}`)}
              className="w-full flex items-center justify-between py-4 px-0 border-b hover:bg-muted/30 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 w-12">이전글</span>
                <h3 className="text-sm font-normal text-foreground/80 group-hover:text-foreground transition-colors truncate flex-1 min-w-0 text-left">
                  {prevArticle.title}
                </h3>
              </div>
              {prevArticle.publishedDate && (
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                  {format(new Date(prevArticle.publishedDate), "yyyy-MM-dd", { locale: ko })}
                </span>
              )}
            </button>
          ) : null}

          {/* 다음글 */}
          {nextArticle ? (
            <button
              onClick={() => router.push(`/profile/${code}/article/${nextArticle.id}`)}
              className="w-full flex items-center justify-between py-4 px-0 border-b hover:bg-muted/30 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 w-12">다음글</span>
                <h3 className="text-sm font-normal text-foreground/80 group-hover:text-foreground transition-colors truncate flex-1 min-w-0 text-left">
                  {nextArticle.title}
                </h3>
              </div>
              {nextArticle.publishedDate && (
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                  {format(new Date(nextArticle.publishedDate), "yyyy-MM-dd", { locale: ko })}
                </span>
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

