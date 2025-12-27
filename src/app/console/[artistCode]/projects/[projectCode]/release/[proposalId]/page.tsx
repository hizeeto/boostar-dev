"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { useArtistContext } from "@/hooks/use-artist-context"

// 퍼블리셔 이미지 URL 생성 함수
function getPublisherImageUrl(fileName: string): string {
  const supabase = createClient()
  const imagePath = `publisher/${fileName}`
  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(imagePath)
  return data.publicUrl
}

// 제안 데이터 타입
interface ProposalData {
  id: string
  publisherName: string
  publisherImage: string
  proposalDate: string
  contractDeadline: string
  // 배급 상세
  releaseDate: string
  countries: string
  platforms: string
  // 수익·정산
  distributionFee: string
  advancePayment: string
  settlementMethod: string
  minimumSettlement: string
  paymentCurrency: string
  paymentMethod: string
  taxReporting: string
  // 계약·권리
  initialContractPeriod: string
  mandatoryContractPeriod: string
  exclusiveRights: string
  contractTermination: string
  // 운영·지원
  infoCorrectionBefore: string
  infoCorrectionAfter: string
  marketingSupport: string[]
  otherSupport: string[]
}

// 제안 데이터 (실제로는 API에서 가져와야 함)
const proposalDataMap: Record<string, ProposalData> = {
  woollim: {
    id: "woollim",
    publisherName: "울림뮤직 엔터테인먼트",
    publisherImage: "141775.jpg",
    proposalDate: "2025-10-28 17:25:48",
    contractDeadline: "2025-11-03 23:59:59",
    releaseDate: "2025-11-14 부터",
    countries: "대한민국 외 21개",
    platforms: "Melon 외 15개",
    distributionFee: "20%",
    advancePayment: "없음",
    settlementMethod: "매월 1일~31일까지 정산하여 다음 달 15일 지급(첫 정산은 발매일로부터 3개월 이후에 진행)",
    minimumSettlement: "40,000원",
    paymentCurrency: "KRW - 대한민국 원(해외 플랫폼의 경우 해당 플랫폼 정책에 따라 환율 적용)",
    paymentMethod: "계좌이체",
    taxReporting: "개인(원천세 3.3%) 또는 사업자(부가세 10%)별 공제 적용",
    initialContractPeriod: "2년",
    mandatoryContractPeriod: "최초계약일로부터 1년",
    exclusiveRights: "병행 배급 제한(계약 기간 내 지역·채널에 대한 독점적 배급권)",
    contractTermination: "법령이 정하지 않은 사유인 경우 의무 계약 기간 종료 후 가능",
    infoCorrectionBefore: "발매 확정 이전 제한 없음, 발매 확정 이후 배급 전까지 수정불가",
    infoCorrectionAfter: "1회",
    marketingSupport: [
      "앨범 발매 소식 유통사 SNS 포스팅",
      "보도자료 배포",
      "스트리밍 플랫폼 매거진",
      "Google Ads",
      "YouTube 플레이리스트 삽입",
      "벅스 라이브 아트"
    ],
    otherSupport: [
      "공유 연습실",
      "뮤직비디오 제작 지원"
    ]
  },
  analog: {
    id: "analog",
    publisherName: "아날로그 엔터테인먼트",
    publisherImage: "1992.jpg",
    proposalDate: "2025-10-27 15:37:16",
    contractDeadline: "2025-11-02 23:59:59",
    releaseDate: "2025-11-11 부터",
    countries: "전 세계",
    platforms: "Apple Music 외 21곳",
    distributionFee: "20%",
    advancePayment: "없음",
    settlementMethod: "매월 1일~31일까지 정산하여 다음 달 15일 지급(첫 정산은 발매일로부터 3개월 이후에 진행)",
    minimumSettlement: "50,000원",
    paymentCurrency: "KRW - 대한민국 원(해외 플랫폼의 경우 해당 플랫폼 정책에 따라 환율 적용)",
    paymentMethod: "계좌이체",
    taxReporting: "개인(원천세 3.3%) 또는 사업자(부가세 10%)별 공제 적용",
    initialContractPeriod: "2년",
    mandatoryContractPeriod: "최초계약일로부터 1년",
    exclusiveRights: "병행 배급 제한(계약 기간 내 지역·채널에 대한 독점적 배급권)",
    contractTermination: "법령이 정하지 않은 사유인 경우 의무 계약 기간 종료 후 가능",
    infoCorrectionBefore: "발매 확정 이전 제한 없음, 발매 확정 이후 배급 전까지 수정불가",
    infoCorrectionAfter: "1회",
    marketingSupport: [
      "앨범 발매 소식 유통사 SNS 포스팅",
      "보도자료 배포",
      "스트리밍 플랫폼 매거진"
    ],
    otherSupport: [
      "공유 연습실"
    ]
  },
  tree: {
    id: "tree",
    publisherName: "트리뮤직앤아트",
    publisherImage: "",
    proposalDate: "2025-10-24 14:27:57",
    contractDeadline: "2025-10-31 23:59:59",
    releaseDate: "2025-10-29 부터",
    countries: "전 세계",
    platforms: "Apple Music 외 21곳",
    distributionFee: "15%",
    advancePayment: "없음",
    settlementMethod: "3개월마다 정산하여 다음 달 15일 지급",
    minimumSettlement: "없음",
    paymentCurrency: "KRW - 대한민국 원(해외 플랫폼의 경우 해당 플랫폼 정책에 따라 환율 적용)",
    paymentMethod: "계좌이체",
    taxReporting: "개인(원천세 3.3%) 또는 사업자(부가세 10%)별 공제 적용",
    initialContractPeriod: "1년",
    mandatoryContractPeriod: "최초계약일로부터 6개월",
    exclusiveRights: "병행 배급 제한(계약 기간 내 지역·채널에 대한 독점적 배급권)",
    contractTermination: "법령이 정하지 않은 사유인 경우 의무 계약 기간 종료 후 가능",
    infoCorrectionBefore: "발매 확정 이전 제한 없음, 발매 확정 이후 배급 전까지 수정불가",
    infoCorrectionAfter: "1회",
    marketingSupport: [
      "앨범 발매 소식 유통사 SNS 포스팅",
      "보도자료 배포"
    ],
    otherSupport: []
  }
}

export default function ProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const artistContext = useArtistContext()
  const proposalId = params.proposalId as string
  const projectCode = params.projectCode as string
  const artistCode = params.artistCode as string

  const proposal = proposalDataMap[proposalId]

  if (!proposal) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">제안을 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  const handleRequestContract = () => {
    // 계약 요청 로직
    console.log("계약 요청:", proposalId)
  }

  const handleInquiry = () => {
    // 문의 로직
    console.log("문의:", proposalId)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* 뒤로가기 버튼 */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push(`/console/${artistCode}/projects/${projectCode}/release?tab=proposal`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로가기
        </Button>

        {/* 메인 레이아웃: 왼쪽 콘텐츠 + 오른쪽 사이드바 */}
        <div className="relative">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 왼쪽: 메인 콘텐츠 */}
            <div className="flex-1 space-y-6 lg:order-1 order-2">
              {/* 배급 상세 */}
              <Card>
                <CardHeader className="pb-4 pt-4">
                  <h3 className="font-semibold text-base leading-tight mt-1">배급 상세</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">발매 가능일</p>
                    <div className="flex items-center gap-2">
                      <p>{proposal.releaseDate}</p>
                      <Button variant="link" className="h-auto p-0 text-primary" asChild>
                        <a href="#" className="text-sm">실시간 발매캘린더</a>
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">배급 가능 국가</p>
                    <div className="flex items-center gap-2">
                      <p>{proposal.countries}</p>
                      <Button variant="link" className="h-auto p-0 text-primary" asChild>
                        <a href="#" className="text-sm">자세히 보기</a>
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">배급 가능 플랫폼</p>
                    <div className="flex items-center gap-2">
                      <p>{proposal.platforms}</p>
                      <Button variant="link" className="h-auto p-0 text-primary" asChild>
                        <a href="#" className="text-sm">자세히 보기</a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 수익·정산 */}
              <Card>
                <CardHeader className="pb-4 pt-4">
                  <h3 className="font-semibold text-base leading-tight mt-1">수익·정산</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">유통 수수료</p>
                    <p>{proposal.distributionFee}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">선지급금</p>
                    <p>{proposal.advancePayment}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">정산 방법</p>
                    <p className="text-base">{proposal.settlementMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">최소 정산금</p>
                    <p className="text-base">{proposal.minimumSettlement}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">지급 통화</p>
                    <p className="text-base">{proposal.paymentCurrency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">지급 수단</p>
                    <p className="text-base">{proposal.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">세무 신고</p>
                    <p className="text-base">{proposal.taxReporting}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 계약·권리 */}
              <Card>
                <CardHeader className="pb-4 pt-4">
                  <h3 className="font-semibold text-base leading-tight mt-1">계약·권리</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">최초 계약 기간</p>
                    <p>{proposal.initialContractPeriod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">의무 계약 기간</p>
                    <p>{proposal.mandatoryContractPeriod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">배타적 권리</p>
                    <p className="text-base">{proposal.exclusiveRights}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">계약 해지</p>
                    <p className="text-base">{proposal.contractTermination}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 운영·지원 */}
              <Card>
                <CardHeader className="pb-4 pt-4">
                  <h3 className="font-semibold text-base leading-tight mt-1">운영·지원</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">배급 전 정보 수정</p>
                    <p className="text-base">{proposal.infoCorrectionBefore}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">배급 후 정보 수정</p>
                    <p className="text-base">{proposal.infoCorrectionAfter}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">마케팅·프로모션 지원</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {proposal.marketingSupport.map((item, index) => (
                        <Badge key={index} variant="outline" className="cursor-pointer hover:bg-accent text-sm">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {proposal.otherSupport.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">기타 지원</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {proposal.otherSupport.map((item, index) => (
                          <Badge key={index} variant="outline" className="cursor-pointer hover:bg-accent text-sm">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 오른쪽: 신청 정보 사이드바 - 별도 카드로 분리 */}
            <div className="w-full lg:w-80 flex-shrink-0 lg:order-2 order-1">
              <Card className="lg:sticky lg:top-6">
                <CardHeader className="pb-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base leading-tight mt-1">신청 정보</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-4 pt-6">
                  {/* 회사/아티스트명 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-8 h-8">
                        {proposal.publisherImage ? (
                          <AvatarImage src={getPublisherImageUrl(proposal.publisherImage)} />
                        ) : null}
                        <AvatarFallback className="bg-amber-100">
                          <span className="text-xs font-semibold text-amber-700">
                            {proposal.publisherName.charAt(0)}
                          </span>
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium flex-1">{proposal.publisherName}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 제안 일시 */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">제안 일시</p>
                    <p className="text-sm">{proposal.proposalDate}</p>
                  </div>

                  {/* 계약 요청 기한 */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">계약 요청 기한</p>
                    <p className="text-sm">{proposal.contractDeadline}</p>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="space-y-2 pt-2">
                    <Button 
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleRequestContract}
                    >
                      계약 요청
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleInquiry}
                    >
                      문의
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

