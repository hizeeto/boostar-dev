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
  { 
    id: "2", 
    category: "트랙 코멘터리", 
    title: "'미지근한 새벽' 8마디에서 시작된 훅", 
    fileName: "42652.jpg", 
    publishedDate: "2025-08-25", 
    content: `'미지근한 새벽'은 거창한 사건에서 출발하지 않았다. 오히려 아무 일도 일어나지 않는 시간, 말이 더는 진척되지 않는 대화, 마음만 계속 미끄러지는 그 순간에서 시작됐다. 그래서 곡의 출발점도 크게 밀어붙이는 멜로디가 아니라, 8마디짜리 짧은 패턴이었다. 짧고 반복되는 문장처럼, '이 정도면 충분히 말했는데도 끝나지 않는' 느낌을 만들고 싶었다.

처음 만든 건 후렴이 아니었다. 훅이라고 부를 만한 것도 아니었다. 다만 8마디 안에서 리듬과 음정이 미세하게 흔들리는 진행이 있었고, 그 흔들림이 새벽의 공기와 닮아 있었다. 새벽은 차갑지도 뜨겁지도 않다. 정확히 말하면, 온도를 단정하기 어려운 시간이다. 창문을 열면 서늘한 공기가 들어오지만, 이불 속은 아직 따뜻하고, 방 안의 조명은 어둡다. 몸은 피곤한데 마음은 이상하게 또렷해지는 그 틈. 우리는 그 틈의 감각을 '미지근함'으로 잡았다.

곡을 만들 때 가장 먼저 정한 원칙은 하나였다. "훅이 과장되면 이 곡은 망한다." 감정을 크게 던지는 후렴은 순간적으로는 시원하지만, '미지근한 새벽'이 담고 싶은 건 시원함이 아니라 남는 온도였다. 그래서 훅은 한 번에 터지는 방식 대신, 8마디의 패턴이 계속 돌아오면서 점점 더 선명해지는 방식으로 설계했다. 같은 말을 반복하는 게 아니라, 같은 문장을 다른 톤으로 다시 말하는 느낌. 처음에는 혼잣말 같고, 두 번째는 메시지 같고, 세 번째는 결국 고백처럼 들리게.

훅의 중심은 음정의 큰 점프가 아니라 리듬의 여백에 있다. 리듬이 촘촘해지면 감정도 쉽게 뜨거워진다. 우리는 그 뜨거움을 피하고 싶었다. 그래서 보컬이 들어오는 순간에도 악기가 지나치게 채우지 않도록, 킥과 스네어 사이에 숨 쉴 공간을 남겼다. 그 여백이 곡의 제목처럼 미지근한 온도를 유지해준다. 듣는 사람도, 부르는 사람도 한 박자 늦게 감정을 따라오게 된다. 그 늦음이 곡의 정체성이 됐다.

결국 이 곡의 훅은 '센 한 방'이 아니라, 8마디가 만들어내는 체온이다. 한 번 듣고 끝나는 멜로디가 아니라, 다시 돌아오는 구간에서 "아, 이 말이었구나" 하고 이해가 생기는 훅. '미지근한 새벽'은 그렇게, 짧은 8마디에서 시작해 곡 전체의 온도를 결정했다. 훅이 곡을 지배한 게 아니라, 곡의 온도가 훅을 만들었다.`
  },
  { 
    id: "3", 
    category: "작업기", 
    title: "기타 톤을 '반투명'하게 만드는 3가지 레이어", 
    fileName: "403858.jpg", 
    publishedDate: "2025-07-16", 
    content: `<유리창의 온도>에서 기타는 '앞으로 나서서 말하는 악기'가 아니다. 오히려 빛을 통과시키는 재질에 가깝다. 존재감은 있지만, 시선을 독점하지는 않는다. 멜로디를 주도하기보다 공간을 만들고, 리듬을 밀기보다 감정을 살짝 들어 올리는 역할. 그래서 톤의 목표도 '선명함'이 아니라 반투명함이었다. 손에 잡히지 않는데 분명히 거기 있는 느낌, 유리창 같은 기타.

이 반투명함은 한 개의 톤으로는 만들기 어렵다. 너무 깨끗하면 차갑고, 너무 드라이브가 걸리면 불투명해진다. 그래서 우리는 기타를 한 번에 완성하지 않고, 서로 다른 역할의 레이어를 얇게 겹쳐서 만들었다.

<h3>1. 기둥이 되는 드라이 톤: 질감은 최소, 어택은 명확</h3>
첫 번째 레이어는 가장 단순하다. 컴프를 과하게 걸지 않고, 어택이 명확한 드라이 톤으로 리듬의 기둥을 세운다. 중요한 건 톤 자체가 멋있어야 하는 게 아니라, 다른 레이어가 얹힐 바탕이 되어야 한다는 점이다. 이 레이어는 항상 가장 현실적인 기타처럼 들려야 한다. 너무 예쁘지도, 너무 거칠지도 않게. 실제 방 안에서 들리는 소리처럼.

<h3>2. 유리 표면 레이어: 코러스/마이크로 피치로 윤곽을 흐리게</h3>
반투명함의 핵심은 윤곽이 살짝 흔들리는 데서 나온다. 그래서 두 번째 레이어는 코러스나 마이크로 피치(아주 미세한 피치 흔들림)를 사용해 표면을 만든다. 이것이 바로 "유리"의 질감이다. 이 레이어는 크지 않아도 된다. 오히려 너무 크면 빈티지 코러스 느낌이 강해져서 의도가 바뀐다. 목표는 "효과"가 아니라 공기 중에 얇게 떠 있는 막이다. 들을 때는 잘 모르겠는데, 꺼보면 갑자기 곡이 퍽퍽해지는 그 레이어.

<h3>3. 공기 레이어: 리버브/딜레이로 거리감을 설계</h3>
세 번째는 공간이다. 하지만 리버브를 크게 넣는다고 공간이 생기지 않는다. 중요한 건 거리감의 설계다. 우리는 기타가 보컬 앞에 튀어나오지 않도록, 리버브와 딜레이를 사용해 기타를 한두 걸음 뒤로 보냈다. 여기서 포인트는 리버브의 크기가 아니라, 프리딜레이와 컷팅(로우/하이 컷)이다. 저역을 걷어내면 탁해지지 않고, 고역을 적당히 정리하면 반짝임이 과하지 않다. 결과적으로 기타는 젖은 소리가 아니라, 빛이 번지는 소리로 남는다.

이 세 레이어가 겹쳐지면, 기타는 선명한 단독 톤이 아니라 반투명한 재질이 된다. 곡의 중심을 뺏지 않으면서도, 전체 온도를 결정하는 악기. <유리창의 온도>에서 우리가 기타를 그렇게 다룬 이유는 간단하다. 유리창은 눈에 띄지 않아도, 방의 분위기를 바꾼다. 기타도 그런 역할이면 충분했다.`
  },
  { 
    id: "4", 
    category: "인터뷰", 
    title: "합주에서 가장 중요한 건 '간격'", 
    fileName: "9941285.jpg", 
    publishedDate: "2025-07-02", 
    content: `우리는 합주를 "맞추는 시간"이라고 말하지만, 사실 더 중요한 건 '비워두는 시간'이다. 소리를 얼마나 잘 맞추느냐보다, 서로의 소리가 들어갈 자리를 얼마나 정확히 남겨두느냐가 합주의 완성도를 결정한다. 그래서 '간격'이라는 단어를 자주 쓴다. 간격은 단순히 템포를 맞추는 문제가 아니다. 볼륨, 프레이징, 호흡, 시선, 그리고 무엇보다 "누가 지금 말하고 있는가"에 대한 합의다.

<h3>Q. 합주에서 간격이 무너지는 순간이 있나?</h3>
"대부분 '열심히' 할 때 무너져요. 각자가 자기 파트를 더 잘해보려고 앞으로 나오면, 결국 다 같이 앞으로 나와서 부딪히죠. 그때는 소리가 커지는데, 이상하게 전달력은 떨어져요."

<h3>Q. 그럼 좋은 간격은 어떻게 생기나?</h3>
"누군가 말할 때 다른 사람은 고개를 끄덕이는 정도로 남아 있는 상태요. 드럼이 리듬을 말하면 베이스는 문장을 정리하고, 기타는 형광펜으로 밑줄을 긋고, 보컬이 결론을 말하는 식. 역할이 정리되면 자연스럽게 간격이 생겨요."

<h3>Q. 간격을 만드는 구체적인 방법이 있다면?</h3>
"첫째는 '다 같이 줄이는 연습'을 해요. 볼륨을 줄이면 빈틈이 드러나고, 누가 과하게 치고 있는지도 바로 보여요. 둘째는 '한 파트씩 빠지는 합주'를 해요. 기타를 빼고도 곡이 굴러가야 하고, 베이스가 빠져도 구조가 느껴져야 해요. 빠졌을 때 허전하면 그 파트의 역할이 명확하다는 뜻이고, 빠져도 별 차이가 없으면 다시 설계해야죠."

<h3>Q. 결국 간격은 기술보다 합의에 가깝다는 말인가?</h3>
"맞아요. 합주는 '내가 잘한다'가 아니라 '우리가 지금 무엇을 전달한다'에 대한 합의죠. 그 합의가 생기면, 연주가 좀 거칠어도 곡이 살아 있어요."

'간격'은 재능보다 태도에 가깝다. 나서지 않는 용기, 덜 치는 자신감, 그리고 지금은 내 차례가 아니다를 인정하는 감각. 그 간격이 생겼을 때, 합주는 비로소 한 덩어리가 아니라 하나의 장면이 된다. <유리창의 온도>가 담고 싶은 것도 결국 그 장면의 공기다. 서로의 소리가 서로를 가리지 않고, 통과시키는 상태.`
  },
  { 
    id: "5", 
    category: "플레이리스트 노트", 
    title: "멤버들이 반복 재생한 9곡", 
    fileName: "1081876.jpg", 
    publishedDate: "2025-06-27", 
    content: `우리는 플레이리스트를 좋아하는 곡 모음이라기보다, 지금의 온도를 기록하는 방법이라고 생각한다. 작업 기간 동안 멤버들이 반복 재생한 곡들은 공통적으로 과장되지 않고, 디테일로 감정을 움직이는 곡들이었다. 크게 터뜨리지 않는데 오래 남는 노래들. <유리창의 온도>의 결을 만든 것도 결국 이런 반복의 취향이었다.

<h3>1) The 1975 — Somebody Else</h3>
감정은 차갑게 정리돼 있는데, 후렴의 반복이 계속 체온을 올린다. 미지근함을 가장 팝적으로 표현한 곡.

<h3>2) Men I Trust — Show Me How</h3>
앞으로 나오지 않는 보컬과 얇은 악기 편성이 만든 공기감. "반투명"이라는 단어가 바로 떠오른다.

<h3>3) LANY — Malibu Nights</h3>
감정을 터뜨리기보다 계속 눌러 담는다. 후렴에서 조금씩 더해지는 레이어링이 교과서처럼 단정하다.

<h3>4) HONNE — Warm On A Cold Night</h3>
제목부터 우리에게는 메모였다. 따뜻함과 차가움이 공존하는 감각을 사운드로 설명하는 방법.

<h3>5) 혁오 — TOMBOY</h3>
톤 자체가 유행을 넘어 하나의 질감이 되는 사례. 기타와 보컬의 "거리감"을 배우게 되는 곡.

<h3>6) wave to earth — seasons</h3>
공간을 크게 쓰지 않는데도 넓게 느껴지는 믹스. 일상의 감정을 과장 없이 붙잡는 방식이 닮아 있다.

<h3>7) 백예린 — Square (2017)</h3>
멜로디가 강한데도 감정이 과열되지 않는다. 보컬의 온도 조절이 정확하다.

<h3>8) Radiohead — Nude</h3>
비어 있는 듯 촘촘한 편곡. 감정을 말하지 않고 '상태'로 남기는 방법.

<h3>9) Frank Ocean — Ivy</h3>
기억을 회상하는 톤, 미묘하게 흔들리는 보컬, 그리고 여백. 한 번 걸리면 쉽게 빠져나오지 않는 온도.

이 9곡은 장르가 같아서가 아니라, 감정을 다루는 방식이 닮아서 한 줄로 이어진다. 크게 소리치지 않고 오래 남기는 음악, 말보다 공기가 먼저 도착하는 음악. 작업이 막힐 때마다 우리는 이 곡들로 돌아갔다. 다시 들으면 이 온도로 가자는 기준이 생겼다. 결국 반복 재생은 레퍼런스가 아니라, 우리의 감각을 다시 정렬하는 리셋 버튼이었다.`
  },
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
          <div 
            className="text-base md:text-lg leading-relaxed [&_p]:mb-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-4"
            dangerouslySetInnerHTML={{ 
              __html: article.content
                .replace(/\n\n+/g, '\n\n')
                .split('\n\n')
                .map(paragraph => {
                  const trimmed = paragraph.trim()
                  if (trimmed.startsWith('<h3>')) {
                    return trimmed
                  }
                  return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`
                })
                .join('')
            }}
          />
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

