"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useArtistContext } from "@/hooks/use-artist-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { Project } from "@/hooks/use-projects"
import { ProjectNavTabs } from "@/components/project-nav-tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Check, Circle, ChevronRight, Plus, X, Upload, RefreshCw, Search, GripVertical, Edit, Pencil, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useProjectMembers } from "@/hooks/use-project-members"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"

// UUID 형식 검증 함수
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// 퍼블리셔 이미지 URL 생성 함수
function getPublisherImageUrl(fileName: string): string {
  const supabase = createClient()
  const imagePath = `publisher/${fileName}`
  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(imagePath)
  return data.publicUrl
}

// 릴리즈 서브 탭 타입
type ReleaseSubTab = "status" | "application" | "proposal" | "contract" | "review" | "monitoring"

// 진행 단계 타입
type ReleaseStep = "application" | "proposal" | "contract" | "review" | "monitoring"

// 신청서 내부 탭 타입
type ApplicationTab = "artist" | "album" | "tracks" | "distribution"

// 진행 이력 타입
interface ReleaseHistory {
  id: string
  dateTime: string
  content: string
  status: "진행 중" | "완료"
}

// 릴리즈 서브 탭 정의
const releaseSubTabs: { id: ReleaseSubTab; label: string }[] = [
  { id: "status", label: "진행 현황" },
  { id: "application", label: "유통 신청" },
  { id: "proposal", label: "받은 제안" },
  { id: "contract", label: "유통사 계약" },
  { id: "review", label: "검수·보완" },
  { id: "monitoring", label: "모니터링" },
]

// 진행 단계 정의
const releaseSteps: { id: ReleaseStep; label: string }[] = [
  { id: "application", label: "유통 신청" },
  { id: "proposal", label: "제안 받기" },
  { id: "contract", label: "유통사 계약" },
  { id: "review", label: "검수·보완" },
  { id: "monitoring", label: "모니터링" },
]

// 샘플 진행 이력 데이터
const sampleHistory: ReleaseHistory[] = [
  {
    id: "1",
    dateTime: "2025-10-27 12:53:15",
    content: "유통 계약 서명",
    status: "진행 중",
  },
  {
    id: "2",
    dateTime: "2025-10-26 17:38:24",
    content: "유통사 계약 요청",
    status: "완료",
  },
  {
    id: "3",
    dateTime: "2025-10-24 12:52:19",
    content: "유통 제안 받기",
    status: "완료",
  },
  {
    id: "4",
    dateTime: "2025-10-24 12:51:27",
    content: "앨범 유통 신청서 제출",
    status: "완료",
  },
]

// 참여 아티스트 역할 목록
const TRACK_ARTIST_ROLES: Record<string, string[]> = {
  "제작 크레딧": [
    "작곡",
    "작사",
    "편곡",
    "공동작곡",
    "공동작사",
    "공동편곡",
    "프로듀서",
    "총괄프로듀서",
    "보컬프로듀서",
    "실행프로듀서",
    "코프로듀서",
    "디렉터",
    "음악감독",
  ],
  "보컬": [
    "보컬",
    "메인보컬",
    "리드보컬",
    "서브보컬",
    "백그라운드보컬",
    "코러스",
    "애드립",
    "랩",
    "내레이션",
    "피처링",
  ],
  "연주": [
    "기타",
    "일렉기타",
    "어쿠스틱기타",
    "베이스",
    "드럼",
    "퍼커션",
    "피아노",
    "키보드",
    "신스",
    "오르간",
  ],
  "스트링": [
    "스트링",
    "바이올린",
    "비올라",
    "첼로",
    "콘트라베이스",
    "하프",
  ],
  "브라스": [
    "브라스",
    "트럼펫",
    "트롬본",
    "호른",
    "색소폰",
    "클라리넷",
    "플루트",
    "오보에",
    "바순",
  ],
  "기타 악기": [
    "하모니카",
    "우쿨렐레",
    "만돌린",
    "밴조",
    "비브라폰",
    "마림바",
    "글로켄슈필",
  ],
  "힙합/비트메이킹": [
    "비트메이커",
    "샘플링",
    "스크래치",
    "턴테이블",
  ],
  "녹음·스튜디오": [
    "레코딩엔지니어",
    "보컬레코딩",
    "악기레코딩",
    "편집",
    "튠",
    "보컬에디팅",
  ],
  "믹싱·마스터링": [
    "믹싱엔지니어",
    "마스터링엔지니어",
    "스템믹싱",
    "서라운드믹싱",
    "돌비애트모스믹싱",
  ],
  "작편곡 보조/스코어": [
    "추가작곡",
    "추가작사",
    "추가편곡",
    "스코어",
    "오케스트레이션",
    "카피스트",
    "트랜스크립션",
  ],
  "퍼포먼스/세션 운영": [
    "세션리더",
    "밴드리더",
    "합창",
    "합창지휘",
    "지휘",
    "콘서트마스터",
  ],
  "사운드/기타": [
    "사운드디자인",
    "폴리",
    "효과음",
    "필드레코딩",
  ],
}

// 장르 데이터
const GENRES = [
  // 댄스/팝
  "케이팝", "팝", "신스팝", "드림팝", "팝록", "파워팝",
  // 발라드/포크
  "어쿠스틱", "포크록", "싱어송라이터",
  // 알앤비·소울
  "네오소울", "얼터너티브 알앤비", "펑크소울",
  // 힙합
  "붐뱁", "트랩", "로파이 힙합", "드릴", "멜로딕 랩",
  // 록/메탈
  "하드록", "얼터너티브 록", "포스트록", "슈게이즈", "개러지록", "프로그레시브 록", "헤비메탈", "데스메탈", "블랙메탈", "메탈코어",
  // 재즈/블루스
  "스윙", "비밥", "퓨전재즈", "보사노바", "블루스록",
  // 일렉트로닉
  "EDM", "일렉트로팝", "신스웨이브", "베이퍼웨이브", "글리치", "칠아웃", "다운템포",
  // 클럽 장르
  "딥하우스", "테크하우스", "프로그레시브 하우스", "미니멀 테크노",
  // 월드/라틴
  "살사", "삼바", "탱고", "레게톤", "바차타", "플라멩코",
  // 국악
  "창", "산조", "풍물", "퓨전국악",
  // 클래식
  "교향곡", "협주곡", "실내악", "독주곡", "성악곡",
  // 사운드트랙
  "드라마음악", "영화음악", "게임음악", "애니메이션음악",
  // 기타
  "인스트루멘털", "로파이", "명상음악", "자연음",
]

export default function ReleasePage() {
  const params = useParams()
  const router = useRouter()
  const artistContext = useArtistContext()
  const activeArtist = artistContext?.activeArtist
  const projectCode = params.projectCode as string
  const artistCode = params.artistCode as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 참여 아티스트 다이얼로그 상태
  const [artistDialogOpen, setArtistDialogOpen] = useState(false)
  const [currentArtistIndex, setCurrentArtistIndex] = useState<number | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [customArtistName, setCustomArtistName] = useState("")
  
  // 프로젝트 멤버 조회
  const { members: projectMembers } = useProjectMembers(project?.id || null)
  
  const [activeSubTab, setActiveSubTab] = useState<ReleaseSubTab>("status")
  const [currentStep, setCurrentStep] = useState<ReleaseStep>("proposal") // 현재 단계: 제안 받기
  const [history, setHistory] = useState<ReleaseHistory[]>(sampleHistory)
  const [activeApplicationTab, setActiveApplicationTab] = useState<ApplicationTab>("artist")
  const isMobile = useIsMobile()

  // 아티스트 정보 폼 상태
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [artistNames, setArtistNames] = useState<Array<{ id: string; lang: string; value: string }>>([
    { id: "name-1", lang: "ko", value: "" },
    { id: "name-2", lang: "en", value: "" },
  ])
  const [artistDescription, setArtistDescription] = useState("")
  const [artistAgency, setArtistAgency] = useState("")
  const [socialMediaFields, setSocialMediaFields] = useState<Array<{ id: string; platform: string; value: string }>>([
    { id: "sns-1", platform: "email", value: "" },
  ])

  // 신청자 정보 폼 상태
  const [applicantName, setApplicantName] = useState("")
  const [applicantPhone, setApplicantPhone] = useState("")
  const [applicantEmail, setApplicantEmail] = useState("")
  const [applicantRelation, setApplicantRelation] = useState("self")
  const [applicantConsent, setApplicantConsent] = useState(false)

  // 앨범 정보 폼 상태
  const [albumImageUrl, setAlbumImageUrl] = useState<string | null>(null)
  const [albumNames, setAlbumNames] = useState<Array<{ id: string; lang: string; value: string }>>([
    { id: "album-name-1", lang: "ko", value: "모래에 쓴 주소" },
    { id: "album-name-2", lang: "en", value: "Address Written In Sand" },
  ])
  const [albumType, setAlbumType] = useState("디지털 싱글")
  const [genreSearchQuery, setGenreSearchQuery] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["어쿠스틱", "포크록"])
  const [showGenreDropdown, setShowGenreDropdown] = useState(false)
  const [albumDescription, setAlbumDescription] = useState("떠난 이에게 보내지 못한 편지를 모티프로 어쿠스틱 포크와 엠비언트 드론, 필드레코딩을 섞어 만든 월드 사운드스케이프다. 손가락으로 모래에 쓴 주소처럼 흔적과 공간을 그린다.")
  const [albumAgency, setAlbumAgency] = useState("")

  // 트랙 관련 상태
  interface Track {
    id: string
    order: number
    nameKo: string
    nameEn: string
    length: string
    artists: string
    genres: string[]
  }

  interface TrackDetail {
    id: string
    names: Array<{ id: string; lang: string; value: string }>
    genres: string[]
    type: "AR" | "MR"
    isAdult: "예" | "아니오" | "Clean"
    beatCreation: "창작" | "구매 포함"
    lyrics: string
    audioFile: string | null
    highlightStart: string
    highlightEnd: string
    videoFile: string | null
    artists: Array<{ id: string; roleId: string; roleName: string; value: string }>
  }

  const [tracks, setTracks] = useState<Track[]>([
    {
      id: "track-1",
      order: 1,
      nameKo: "파도선의 주소",
      nameEn: "Address by the Tideline",
      length: "00:04:27",
      artists: "이민철 외 5인",
      genres: ["어쿠스틱", "포크록"],
    },
  ])

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>("track-1")
  
  // 트랙이 변경될 때 첫 번째 트랙 자동 선택
  useEffect(() => {
    if (tracks.length > 0 && !selectedTrackId) {
      setSelectedTrackId(tracks[0].id)
    } else if (tracks.length === 0) {
      setSelectedTrackId(null)
    }
  }, [tracks.length])
  const [trackDetails, setTrackDetails] = useState<Record<string, TrackDetail>>({
    "track-1": {
      id: "track-1",
      names: [
        { id: "name-1", lang: "ko", value: "파도선의 주소" },
        { id: "name-2", lang: "en", value: "Address by the Tideline" },
      ],
      genres: ["어쿠스틱", "포크록"],
      type: "AR",
      isAdult: "아니오",
      beatCreation: "창작",
      lyrics: "",
      audioFile: "파도선의 주소_final.mp3 (00:04:27)",
      highlightStart: "00:01:15",
      highlightEnd: "00:01:48",
      videoFile: null,
      artists: [
        { id: "artist-1", roleId: "", roleName: "", value: "" },
      ],
    },
  })

  // 참여 아티스트 역할 목록 (고정 목록 사용)
  const rolesByCategory = TRACK_ARTIST_ROLES

  // 트랙 장르 검색
  const [trackGenreSearchQuery, setTrackGenreSearchQuery] = useState("")
  const [showTrackGenreDropdown, setShowTrackGenreDropdown] = useState(false)
  const trackGenreDropdownRef = useRef<HTMLDivElement>(null)

  const filteredTrackGenres = GENRES.filter(genre => 
    genre.toLowerCase().includes(trackGenreSearchQuery.toLowerCase()) &&
    !(trackDetails[selectedTrackId || ""]?.genres.includes(genre) || false)
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (trackGenreDropdownRef.current && !trackGenreDropdownRef.current.contains(event.target as Node)) {
        setShowTrackGenreDropdown(false)
      }
    }

    if (showTrackGenreDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showTrackGenreDropdown])

  // 새 트랙 추가
  const handleAddTrack = () => {
    const newOrder = tracks.length + 1
    const newTrackId = `track-${Date.now()}`
    const newTrack: Track = {
      id: newTrackId,
      order: newOrder,
      nameKo: "",
      nameEn: "",
      length: "00:00:00",
      artists: "",
      genres: [],
    }
    
    const newTrackDetail: TrackDetail = {
      id: newTrackId,
      names: [
        { id: `name-${Date.now()}-1`, lang: "ko", value: "" },
        { id: `name-${Date.now()}-2`, lang: "en", value: "" },
      ],
      genres: ["어쿠스틱", "포크록"],
      type: "AR",
      isAdult: "아니오",
      beatCreation: "창작",
      lyrics: "",
      audioFile: null,
      highlightStart: "00:00:00",
      highlightEnd: "00:00:00",
      videoFile: null,
      artists: [
        { id: `artist-${Date.now()}`, roleId: "", roleName: "", value: "" },
      ],
    }

    setTracks([...tracks, newTrack])
    setTrackDetails({ ...trackDetails, [newTrackId]: newTrackDetail })
    setSelectedTrackId(newTrackId)
  }

  // 트랙 선택
  const handleSelectTrack = (trackId: string) => {
    setSelectedTrackId(trackId)
  }

  // 트랙 삭제
  const handleDeleteTrack = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // 마지막 트랙인 경우 삭제 불가
    if (tracks.length === 1) {
      toast.error("최소 1개의 트랙이 필요합니다.")
      return
    }

    // 트랙 삭제
    const updatedTracks = tracks.filter(t => t.id !== trackId)
    // order 재정렬
    const reorderedTracks = updatedTracks.map((t, index) => ({
      ...t,
      order: index + 1
    }))
    setTracks(reorderedTracks)

    // trackDetails에서도 삭제
    const updatedTrackDetails = { ...trackDetails }
    delete updatedTrackDetails[trackId]
    setTrackDetails(updatedTrackDetails)

    // 삭제된 트랙이 선택된 트랙이었다면 첫 번째 트랙 선택
    if (selectedTrackId === trackId) {
      if (reorderedTracks.length > 0) {
        setSelectedTrackId(reorderedTracks[0].id)
      } else {
        setSelectedTrackId(null)
      }
    }

    toast.success("트랙이 삭제되었습니다.")
  }

  // 장르 검색 필터링
  const filteredGenres = GENRES.filter(genre => 
    genre.toLowerCase().includes(genreSearchQuery.toLowerCase()) &&
    !selectedGenres.includes(genre)
  )

  // 장르 선택 핸들러
  const handleGenreSelect = (genre: string) => {
    if (!selectedGenres.includes(genre)) {
      setSelectedGenres([...selectedGenres, genre])
      setGenreSearchQuery("")
      setShowGenreDropdown(false)
    }
  }

  // 장르 제거 핸들러
  const handleGenreRemove = (genre: string) => {
    setSelectedGenres(selectedGenres.filter(g => g !== genre))
  }

  // 장르 검색 드롭다운 외부 클릭 감지
  const genreDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setShowGenreDropdown(false)
      }
    }

    if (showGenreDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showGenreDropdown])

  const loadProject = useCallback(async () => {
    if (!activeArtist) {
      // 아티스트가 아직 로딩 중이면 기다림
      if (artistContext?.loading) {
        return
      }
      // 로딩이 완료되었지만 아티스트가 없는 경우에만 리다이렉트
      if (artistContext && !artistContext.loading && artistContext.artists.length === 0) {
        console.error("[릴리즈] 활성 아티스트가 없습니다")
        router.push(`/console/${artistCode}/projects`)
      }
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('projects')
        .select('*')
        .eq('artist_id', activeArtist.id)

      if (isValidUUID(projectCode)) {
        query = query.or(`project_code.eq.${projectCode},id.eq.${projectCode}`)
      } else {
        query = query.eq('project_code', projectCode)
      }

      const { data, error } = await query.maybeSingle()

      if (error) {
        console.error("[릴리즈] 프로젝트 조회 오류:", error)
        toast.error("프로젝트를 불러오는 중 오류가 발생했습니다")
        router.push(`/console/${artistCode}/projects`)
        return
      }

      if (!data) {
        toast.error("프로젝트를 찾을 수 없습니다")
        router.push(`/console/${artistCode}/projects`)
        return
      }

      setProject(data as Project)
    } catch (err) {
      console.error("[릴리즈] 프로젝트 로드 실패:", err)
      toast.error("프로젝트를 불러오는 중 오류가 발생했습니다")
      router.push(`/console/${artistCode}/projects`)
    } finally {
      setLoading(false)
    }
  }, [activeArtist, projectCode, artistCode, router, artistContext])

  // 아티스트 프로필 정보 로드 (자동 로드용, toast 없음)
  const loadArtistProfile = useCallback(() => {
    if (!activeArtist) {
      return
    }

    try {
      // 프로필 이미지
      setProfileImageUrl(activeArtist.icon_url || null)

      // 아티스트명 (다국어)
      const names: Record<string, string> = {}
      if (activeArtist.names && typeof activeArtist.names === 'object') {
        Object.assign(names, activeArtist.names)
      }
      
      // 언어 필드 구성 (한국어 우선, 그 다음 영어, 나머지는 알파벳 순)
      const languageKeys = Object.keys(names)
      const sortedKeys = [
        ...languageKeys.filter(lang => lang === 'ko'),
        ...languageKeys.filter(lang => lang === 'en'),
        ...languageKeys.filter(lang => lang !== 'ko' && lang !== 'en').sort()
      ]

      const nameFields = sortedKeys.length > 0
        ? sortedKeys.map((lang, index) => ({
            id: `name-${index + 1}`,
            lang,
            value: names[lang] || "",
          }))
        : [
            { id: "name-1", lang: "ko", value: "" },
            { id: "name-2", lang: "en", value: "" },
          ]

      // 최소 2개 필드 유지
      if (nameFields.length === 0) {
        nameFields.push(
          { id: "name-1", lang: "ko", value: "" },
          { id: "name-2", lang: "en", value: "" }
        )
      } else if (nameFields.length === 1) {
        const hasKo = nameFields.some(nf => nf.lang === 'ko')
        if (hasKo) {
          nameFields.push({ id: "name-2", lang: "en", value: "" })
        } else {
          nameFields.unshift({ id: "name-1", lang: "ko", value: "" })
        }
      }

      setArtistNames(nameFields)

      // 아티스트 소개
      setArtistDescription(activeArtist.description || "")

      // 기획사
      setArtistAgency(activeArtist.agency || "")

      // 소셜 미디어
      const sns: Record<string, string> = {}
      if (activeArtist.sns && typeof activeArtist.sns === 'object') {
        Object.assign(sns, activeArtist.sns)
      }

      const snsKeys = Object.keys(sns)
      const snsFields = snsKeys.length > 0
        ? snsKeys.map((platform, index) => ({
            id: `sns-${index + 1}`,
            platform,
            value: sns[platform] || "",
          }))
        : [{ id: "sns-1", platform: "email", value: "" }]

      setSocialMediaFields(snsFields)
    } catch (error) {
      console.error("프로필 정보 로드 오류:", error)
    }
  }, [activeArtist])

  // 신청자 프로필 정보 로드 (자동 로드용, toast 없음)
  const loadApplicantProfile = useCallback(async () => {
    try {
      const supabase = createClient()
      
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      let userId: string
      
      if (demoUser) {
        userId = DEMO_USER_ID
      } else {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          return
        }
        
        userId = user.id
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, nickname, phone, email")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("신청자 프로필 로드 오류:", error)
        return
      }

      if (data) {
        // 신청자명: full_name 우선, 없으면 nickname
        setApplicantName(data.full_name || data.nickname || "")
        // 신청자 연락처
        setApplicantPhone(data.phone || "")
        // 신청자 이메일
        setApplicantEmail(data.email || "")
      }
    } catch (error) {
      console.error("신청자 프로필 정보 로드 오류:", error)
    }
  }, [])

  useEffect(() => {
    if (activeArtist) {
      loadProject()
      // 아티스트 프로필 정보 자동 로드
      loadArtistProfile()
      // 신청자 프로필 정보 자동 로드
      loadApplicantProfile()
    } else if (artistContext && !artistContext.loading) {
      // 아티스트 목록이 비어있을 때만 리다이렉트
      if (artistContext.artists.length === 0) {
        router.push(`/console/${artistCode}/projects`)
      }
      // 아티스트 목록이 있으면 activeArtist가 설정될 때까지 기다림
    }
  }, [projectCode, activeArtist?.id, artistContext?.loading, artistContext?.artists.length, loadProject, loadArtistProfile, loadApplicantProfile, artistCode, router, artistContext])

  // 단계 상태 확인
  const getStepStatus = (stepId: ReleaseStep) => {
    const stepIndex = releaseSteps.findIndex(s => s.id === stepId)
    const currentStepIndex = releaseSteps.findIndex(s => s.id === currentStep)
    
    if (stepIndex < currentStepIndex) {
      return "completed" // 완료
    } else if (stepIndex === currentStepIndex) {
      return "active" // 현재
    } else {
      return "pending" // 대기
    }
  }

  // 아티스트 프로필 정보 동기화 (수동 동기화용, toast 있음)
  const syncArtistProfile = () => {
    if (!activeArtist) {
      toast.error("아티스트 정보를 불러올 수 없습니다")
      return
    }

    try {
      loadArtistProfile()
      toast.success("아티스트 프로필 정보가 동기화되었습니다")
    } catch (error) {
      console.error("동기화 오류:", error)
      toast.error("동기화 중 오류가 발생했습니다")
    }
  }

  if (!artistContext || artistContext.loading || !activeArtist || loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">프로젝트를 찾을 수 없습니다</p>
          <p className="text-sm text-muted-foreground mt-2">
            프로젝트 목록으로 돌아가는 중...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* 상단 네비게이션 탭 */}
      <ProjectNavTabs
        projectCode={projectCode}
        projectId={project.id}
        artistCode={artistCode}
      />
      
      {/* 릴리즈 컨텐츠 */}
      <div className="flex flex-1 flex-col overflow-hidden h-full">
        {/* 서브 탭 네비게이션 */}
        <div className="border-b bg-background flex-shrink-0">
          <nav className="flex flex-nowrap gap-6 px-6 overflow-x-auto scrollbar-hide">
            {releaseSubTabs.map((tab) => {
              const isDisabled = tab.id === "contract" || tab.id === "review" || tab.id === "monitoring"
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveSubTab(tab.id)}
                  disabled={isDisabled}
                  className={cn(
                    "relative py-4 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
                    isDisabled && "cursor-not-allowed opacity-50",
                    activeSubTab === tab.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                    !isDisabled && "hover:text-foreground"
                  )}
                >
                  {tab.label}
                  {activeSubTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* 진행 현황 컨텐츠 */}
        {activeSubTab === "status" && (
          <div className="flex-1 overflow-y-auto p-6">
            {/* 모든 요소를 같은 너비로 맞추기 위한 컨테이너 */}
            <div className="w-fit space-y-8">
              {/* 진행 상태 섹션 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">진행 상태</h3>
                
                {/* 진행 스테퍼 */}
                <div className="relative py-2">
                  {isMobile ? (
                    // 모바일: 세로 배치
                    <div className="flex flex-col">
                      {releaseSteps.map((step, index) => {
                        const status = getStepStatus(step.id)
                        const isLast = index === releaseSteps.length - 1
                        const isCompleted = status === "completed"
                        const isActive = status === "active"
                        const isPending = status === "pending"
                        const currentStepIndex = releaseSteps.findIndex(s => s.id === currentStep)
                        
                        // 연결선 색상 결정: 현재 단계 이전까지는 보라색
                        const lineColor = index < currentStepIndex
                          ? "bg-primary"
                          : "bg-gray-200"
                        
                        return (
                          <div key={step.id} className="flex items-start flex-none">
                            {/* 왼쪽: 원과 연결선 */}
                            <div className="flex flex-col items-center mr-3">
                              <div className="relative z-10">
                                <div
                                  className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
                                    isCompleted && "bg-primary shadow-sm",
                                    isActive && "bg-primary shadow-md ring-2 ring-primary/20",
                                    isPending && "bg-white border-2 border-gray-200"
                                  )}
                                >
                                  {isCompleted && (
                                    <Check className="h-3 w-3 text-white stroke-[2.5]" />
                                  )}
                                  {isActive && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                  {isPending && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                  )}
                                </div>
                              </div>
                              {/* 세로 연결선 */}
                              {!isLast && (
                                <div className="relative w-0.5 h-8 mt-1.5">
                                  <div
                                    className={cn(
                                      "w-full h-full transition-colors duration-200",
                                      lineColor
                                    )}
                                  />
                                </div>
                              )}
                            </div>
                            
                            {/* 오른쪽: 라벨 */}
                            <div className="flex-1 py-1">
                              <span
                                className={cn(
                                  "text-sm font-medium leading-tight",
                                  isCompleted && "text-primary",
                                  isActive && "text-primary",
                                  isPending && "text-gray-400"
                                )}
                              >
                                {step.label}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    // 데스크톱: 가로 배치
                    <div className="flex items-start">
                      {releaseSteps.map((step, index) => {
                        const status = getStepStatus(step.id)
                        const isLast = index === releaseSteps.length - 1
                        const isCompleted = status === "completed"
                        const isActive = status === "active"
                        const isPending = status === "pending"
                        const currentStepIndex = releaseSteps.findIndex(s => s.id === currentStep)
                        
                        // 연결선 색상 결정: 현재 단계 이전까지는 보라색
                        const lineColor = index < currentStepIndex
                          ? "bg-primary"
                          : "bg-gray-200"
                        
                        return (
                          <div key={step.id} className="flex items-start flex-none">
                            {/* 단계 원과 라벨 */}
                            <div className="flex flex-col items-center">
                              <div className="relative z-10">
                                <div
                                  className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
                                    isCompleted && "bg-primary shadow-sm",
                                    isActive && "bg-primary shadow-md ring-2 ring-primary/20",
                                    isPending && "bg-white border-2 border-gray-200"
                                  )}
                                >
                                  {isCompleted && (
                                    <Check className="h-3 w-3 text-white stroke-[2.5]" />
                                  )}
                                  {isActive && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                  {isPending && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                  )}
                                </div>
                              </div>
                              <span
                                className={cn(
                                  "mt-2 text-sm font-medium text-center leading-tight whitespace-nowrap",
                                  isCompleted && "text-primary",
                                  isActive && "text-primary",
                                  isPending && "text-gray-400"
                                )}
                              >
                                {step.label}
                              </span>
                            </div>
                            
                            {/* 연결선 */}
                            {!isLast && (
                              <div className="relative w-12 h-0.5 mx-3 mt-3">
                                <div
                                  className={cn(
                                    "h-full w-full transition-colors duration-200",
                                    lineColor
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 제안 도착 알림 카드 */}
                {currentStep === "proposal" && (
                  <div className="pt-4">
                    <Card className="w-full">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-700">
                            유통사로부터 제안이 도착했습니다.
                          </p>
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setActiveSubTab("proposal")
                            }}
                          >
                            이동
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* 진행 이력 섹션 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">진행 이력</h3>
                
                {/* 이력 테이블 */}
                <div className="rounded-md border overflow-hidden w-full">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-40">
                          일시
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          내용
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-24">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-900 w-40 whitespace-nowrap">
                            {item.dateTime}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.content}
                          </td>
                          <td className="px-4 py-3 w-24">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs px-2 py-0.5 border-transparent whitespace-nowrap",
                                item.status === "진행 중"
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-200 text-gray-700"
                              )}
                            >
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 유통 신청 탭 컨텐츠 */}
        {activeSubTab === "application" && (
          <div className="flex-1 overflow-y-auto p-6">
            {/* 모바일용 하위 탭 드롭다운 */}
            {isMobile && (
              <div className="mb-6">
                <Select
                  value={activeApplicationTab}
                  onValueChange={(value) => setActiveApplicationTab(value as ApplicationTab)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {[
                        { id: "artist" as ApplicationTab, label: "아티스트·신청자" },
                        { id: "album" as ApplicationTab, label: "앨범" },
                        { id: "tracks" as ApplicationTab, label: "수록곡" },
                        { id: "distribution" as ApplicationTab, label: "유통·권리" },
                      ].find(tab => tab.id === activeApplicationTab)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="artist">아티스트·신청자</SelectItem>
                    <SelectItem value="album">앨범</SelectItem>
                    <SelectItem value="tracks">수록곡</SelectItem>
                    <SelectItem value="distribution">유통·권리</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-12 items-start">
              {/* 왼쪽 컬럼: 메인 폼 */}
              <div className="flex-1 space-y-8 min-w-0 max-w-2xl">
                {/* 아티스트·신청자 탭 */}
                {activeApplicationTab === "artist" && (
                  <>
                  {/* 아티스트 정보 섹션 */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">아티스트 정보</h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={syncArtistProfile}
                        className="gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        프로필 동기화
                      </Button>
                    </div>
                    
                    {/* 프로필 이미지 */}
                    <Field>
                      <FieldLabel>프로필 이미지</FieldLabel>
                      <FieldContent>
                        <div className="flex gap-4 items-center">
                          <div 
                            className="relative flex-shrink-0 cursor-pointer"
                            onClick={() => {
                              // TODO: 파일 선택 기능 구현
                            }}
                          >
                            {profileImageUrl ? (
                              <img
                                src={profileImageUrl}
                                alt="프로필 이미지"
                                className="w-24 h-24 rounded-full object-cover border-2 border-border"
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 flex-1">
                            <div className="text-sm text-muted-foreground">
                              이미지 파일(png, jpg 등) 업로드<br></br>
                              최대 5MB까지 가능
                            </div>
                            <div className="flex gap-1 mt-1">
                              {profileImageUrl ? (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => {
                                      // TODO: 파일 선택 기능 구현
                                    }}
                                  >
                                    변경
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => setProfileImageUrl(null)}
                                  >
                                    삭제
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  onClick={() => {
                                    // TODO: 파일 선택 기능 구현
                                  }}
                                >
                                  추가
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </FieldContent>
                    </Field>

                    {/* 아티스트명 */}
                    <Field>
                      <FieldLabel>아티스트명</FieldLabel>
                      <FieldContent>
                        <div className="space-y-2">
                          {artistNames.map((nameField, index) => (
                            <div key={nameField.id} className="flex items-center gap-2">
                              <div className="relative flex items-center flex-1 rounded-md border border-input bg-background h-10 overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                <Select
                                  value={nameField.lang}
                                  onValueChange={(value) => {
                                    const newNames = [...artistNames]
                                    newNames[index] = { ...newNames[index], lang: value }
                                    setArtistNames(newNames)
                                  }}
                                >
                                  <SelectTrigger className="h-10 border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 rounded-none px-3 py-2 w-auto min-w-[100px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ko">한국어</SelectItem>
                                    <SelectItem value="en">영어</SelectItem>
                                    <SelectItem value="ja">일본어</SelectItem>
                                    <SelectItem value="zh">중국어</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="h-6 w-px bg-border flex-shrink-0" />
                                <Input
                                  value={nameField.value}
                                  onChange={(e) => {
                                    const newNames = [...artistNames]
                                    newNames[index] = { ...newNames[index], value: e.target.value }
                                    setArtistNames(newNames)
                                  }}
                                  className="flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-3 py-2 h-full"
                                  placeholder="아티스트명 입력"
                                />
                              </div>
                              {artistNames.length > 2 && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => {
                                    setArtistNames(artistNames.filter((_, i) => i !== index))
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                              {index === artistNames.length - 1 && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => {
                                    setArtistNames([
                                      ...artistNames,
                                      { id: `name-${Date.now()}`, lang: "en", value: "" },
                                    ])
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </FieldContent>
                    </Field>

                    {/* 아티스트 소개 */}
                    <Field>
                      <FieldLabel>아티스트 소개</FieldLabel>
                      <FieldContent>
                        <Textarea
                          value={artistDescription}
                          onChange={(e) => setArtistDescription(e.target.value)}
                          className="min-h-[120px]"
                          placeholder="아티스트 소개를 입력해주세요"
                        />
                      </FieldContent>
                    </Field>

                    {/* 커뮤니케이션 & 소셜 미디어 */}
                    <Field>
                      <FieldLabel>커뮤니케이션 & 소셜 미디어</FieldLabel>
                      <FieldContent>
                        <div className="space-y-2">
                          {socialMediaFields.map((snsField, index) => (
                            <div key={snsField.id} className="flex items-center gap-2">
                              <div className="relative flex items-center flex-1 rounded-md border border-input bg-background h-10 overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                <Select
                                  value={snsField.platform}
                                  onValueChange={(value) => {
                                    const newFields = [...socialMediaFields]
                                    newFields[index] = { ...newFields[index], platform: value }
                                    setSocialMediaFields(newFields)
                                  }}
                                >
                                  <SelectTrigger className="h-10 border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 rounded-none px-3 py-2 w-auto min-w-[120px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                    <SelectItem value="youtube">YouTube</SelectItem>
                                    <SelectItem value="soundcloud">Soundcloud</SelectItem>
                                    <SelectItem value="twitter">Twitter/X</SelectItem>
                                    <SelectItem value="facebook">Facebook</SelectItem>
                                    <SelectItem value="tiktok">TikTok</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="h-6 w-px bg-border flex-shrink-0" />
                                <Input
                                  value={snsField.value}
                                  onChange={(e) => {
                                    const newFields = [...socialMediaFields]
                                    newFields[index] = { ...newFields[index], value: e.target.value }
                                    setSocialMediaFields(newFields)
                                  }}
                                  className="flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-3 py-2 h-full"
                                  placeholder="연락처 또는 URL 입력"
                                />
                              </div>
                              {socialMediaFields.length > 1 && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => {
                                    setSocialMediaFields(socialMediaFields.filter((_, i) => i !== index))
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                              {index === socialMediaFields.length - 1 && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => {
                                    setSocialMediaFields([
                                      ...socialMediaFields,
                                      { id: `sns-${Date.now()}`, platform: "email", value: "" },
                                    ])
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </FieldContent>
                    </Field>

                    {/* 기획사 */}
                    <Field>
                      <FieldLabel>기획사</FieldLabel>
                      <FieldContent>
                        <Input
                          value={artistAgency}
                          onChange={(e) => setArtistAgency(e.target.value)}
                          placeholder="기획사를 입력해주세요 (없는 경우 비워두기)"
                        />
                      </FieldContent>
                    </Field>
                  </div>

                  {/* 신청자 정보 섹션 */}
                  <div className="space-y-6 pt-6 border-t">
                    <h2 className="text-2xl font-semibold">신청자 정보</h2>
                    
                    <div className="space-y-6">
                      <Field>
                        <FieldLabel>신청자명</FieldLabel>
                        <FieldContent>
                          <Input 
                            value={applicantName}
                            onChange={(e) => setApplicantName(e.target.value)}
                            placeholder="신청자명을 입력해주세요"
                          />
                        </FieldContent>
                      </Field>
                      
                      <Field>
                        <FieldLabel>신청자 연락처</FieldLabel>
                        <FieldContent>
                          <Input 
                            value={applicantPhone}
                            onChange={(e) => setApplicantPhone(e.target.value)}
                            placeholder="연락처를 입력해주세요"
                          />
                        </FieldContent>
                      </Field>
                      
                      <Field>
                        <FieldLabel>신청자 이메일</FieldLabel>
                        <FieldContent>
                          <Input 
                            value={applicantEmail}
                            onChange={(e) => setApplicantEmail(e.target.value)}
                            placeholder="이메일을 입력해주세요"
                          />
                        </FieldContent>
                      </Field>
                      
                      <Field>
                        <FieldLabel>아티스트와의 관계</FieldLabel>
                        <FieldContent>
                          <Select value={applicantRelation} onValueChange={setApplicantRelation}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="self">아티스트 본인(대리인 포함)</SelectItem>
                              <SelectItem value="manager">매니저</SelectItem>
                              <SelectItem value="agency">기획사 담당자</SelectItem>
                              <SelectItem value="other">기타</SelectItem>
                            </SelectContent>
                          </Select>
                        </FieldContent>
                      </Field>
                      
                      <Field>
                        <FieldContent>
                          <div className="flex items-start gap-2">
                            <Checkbox 
                              id="consent" 
                              checked={applicantConsent}
                              onCheckedChange={(checked) => setApplicantConsent(checked === true)}
                              className="mt-1" 
                            />
                            <label
                              htmlFor="consent"
                              className="text-sm leading-relaxed cursor-pointer"
                            >
                              신청자 본인은 해당 아티스트의 신규 앨범을 신청함에 있어 적법한 권리를 보유하였음을 확인합니다.
                            </label>
                          </div>
                        </FieldContent>
                      </Field>
                    </div>
                  </div>
                </>
                )}

                {/* 앨범 탭 */}
                {activeApplicationTab === "album" && (
                  <div className="space-y-6">
                    {/* 헤더 */}
                    <h2 className="text-xl font-semibold">앨범 정보</h2>

                    {/* 프로필 이미지 */}
                    <Field>
                      <FieldLabel>프로필 이미지</FieldLabel>
                      <FieldContent>
                        <div className="flex gap-4 items-start">
                          <div 
                            className="relative flex-shrink-0 cursor-pointer"
                            onClick={() => {
                              // TODO: 파일 선택 기능 구현
                            }}
                          >
                            {albumImageUrl ? (
                              <img
                                src={albumImageUrl}
                                alt="앨범 이미지"
                                className="w-24 h-24 rounded object-cover border-2 border-border"
                              />
                            ) : (
                              <div className="w-24 h-24 rounded bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 flex-1">
                            <div className="text-sm text-muted-foreground">
                              최소 3000×3000px 이상의 JPG파일<br></br>
                              최대 10MB 크기까지 업로드 가능
                            </div>
                            <div className="flex gap-1 mt-1">
                              {albumImageUrl ? (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => {
                                      // TODO: 파일 선택 기능 구현
                                    }}
                                  >
                                    변경
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => setAlbumImageUrl(null)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    삭제
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  onClick={() => {
                                    // TODO: 파일 선택 기능 구현
                                  }}
                                >
                                  추가
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </FieldContent>
                    </Field>

                    {/* 앨범명 */}
                    <Field>
                      <FieldLabel>앨범명</FieldLabel>
                      <FieldContent>
                        <div className="space-y-2">
                          {albumNames.map((nameField, index) => (
                            <div key={nameField.id} className="flex items-center gap-2">
                              <div className="relative flex items-center flex-1 rounded-md border border-input bg-background h-10 overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                <Select
                                  value={nameField.lang}
                                  onValueChange={(value) => {
                                    const newNames = [...albumNames]
                                    newNames[index] = { ...newNames[index], lang: value }
                                    setAlbumNames(newNames)
                                  }}
                                >
                                  <SelectTrigger className="h-10 border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 rounded-none px-3 py-2 w-auto min-w-[100px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ko">한국어</SelectItem>
                                    <SelectItem value="en">영어</SelectItem>
                                    <SelectItem value="ja">일본어</SelectItem>
                                    <SelectItem value="zh">중국어</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="h-6 w-px bg-border flex-shrink-0" />
                                <Input
                                  value={nameField.value}
                                  onChange={(e) => {
                                    const newNames = [...albumNames]
                                    newNames[index] = { ...newNames[index], value: e.target.value }
                                    setAlbumNames(newNames)
                                  }}
                                  className="flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-3 py-2 h-full"
                                  placeholder="앨범명 입력"
                                />
                              </div>
                              {albumNames.length > 2 && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => {
                                    setAlbumNames(albumNames.filter((_, i) => i !== index))
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                              {index === albumNames.length - 1 && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => {
                                    setAlbumNames([
                                      ...albumNames,
                                      { id: `album-name-${Date.now()}`, lang: "en", value: "" },
                                    ])
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </FieldContent>
                    </Field>

                    {/* 유형 */}
                    <Field>
                      <FieldLabel>유형</FieldLabel>
                      <FieldContent>
                        <Select value={albumType} onValueChange={setAlbumType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="디지털 싱글">디지털 싱글</SelectItem>
                            <SelectItem value="디지털 EP">디지털 EP</SelectItem>
                            <SelectItem value="디지털 앨범">디지털 앨범</SelectItem>
                            <SelectItem value="싱글">싱글</SelectItem>
                            <SelectItem value="EP">EP</SelectItem>
                            <SelectItem value="정규 앨범">정규 앨범</SelectItem>
                            <SelectItem value="컴필레이션">컴필레이션</SelectItem>
                            <SelectItem value="리믹스">리믹스</SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>

                    {/* 장르 */}
                    <Field>
                      <FieldLabel>장르</FieldLabel>
                      <FieldContent>
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            장르를 검색 후 선택해 주세요.
                          </div>
                          <div className="relative" ref={genreDropdownRef}>
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <Input
                              value={genreSearchQuery}
                              onChange={(e) => {
                                setGenreSearchQuery(e.target.value)
                                setShowGenreDropdown(true)
                              }}
                              onFocus={() => setShowGenreDropdown(true)}
                              placeholder="장르 검색"
                              className="pl-9"
                            />
                            {genreSearchQuery && (
                              <button
                                onClick={() => {
                                  setGenreSearchQuery("")
                                  setShowGenreDropdown(false)
                                }}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                                type="button"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                            {/* 검색 결과 드롭다운 */}
                            {showGenreDropdown && filteredGenres.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                                {filteredGenres.map((genre) => (
                                  <button
                                    key={genre}
                                    type="button"
                                    onClick={() => handleGenreSelect(genre)}
                                    className="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                                  >
                                    {genre}
                                  </button>
                                ))}
                              </div>
                            )}
                            {showGenreDropdown && genreSearchQuery && filteredGenres.length === 0 && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 p-4 text-sm text-muted-foreground text-center">
                                검색 결과가 없습니다
                              </div>
                            )}
                          </div>
                          {selectedGenres.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {selectedGenres.map((genre) => (
                                <Badge
                                  key={genre}
                                  variant="secondary"
                                  className="px-3 py-1 text-sm flex items-center gap-1.5"
                                >
                                  {genre}
                                  <button
                                    type="button"
                                    onClick={() => handleGenreRemove(genre)}
                                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </FieldContent>
                    </Field>

                    {/* 앨범 소개 */}
                    <Field>
                      <FieldLabel>앨범 소개</FieldLabel>
                      <FieldContent>
                        <Textarea
                          value={albumDescription}
                          onChange={(e) => setAlbumDescription(e.target.value)}
                          className="min-h-[120px]"
                          placeholder="앨범 소개를 입력해주세요"
                        />
                      </FieldContent>
                    </Field>

                    {/* 기획사 */}
                    <Field>
                      <FieldLabel>기획사</FieldLabel>
                      <FieldContent>
                        <Input
                          value={albumAgency}
                          onChange={(e) => setAlbumAgency(e.target.value)}
                          placeholder="기획사를 입력해주세요(없는 경우 메일)"
                        />
                      </FieldContent>
                    </Field>
                  </div>
                )}

                {/* 수록곡 탭 */}
                {activeApplicationTab === "tracks" && (
                  <div className="space-y-8">
                    {/* 트랙 리스트 섹션 */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">트랙 리스트</h2>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddTrack}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          새 트랙 추가
                        </Button>
                      </div>

                      {/* 트랙 테이블 */}
                      <div className="rounded-md border overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-16">
                                No.
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                곡명
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-24">
                                길이
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                아티스트
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-28">
                                수정
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {tracks.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                  트랙이 없습니다. &quot;새 트랙 추가&quot; 버튼을 클릭하여 트랙을 추가하세요.
                                </td>
                              </tr>
                            ) : (
                              tracks.map((track) => (
                              <tr
                                key={track.id}
                                className={cn(
                                  "hover:bg-gray-50 transition-colors cursor-pointer",
                                  selectedTrackId === track.id && "bg-primary/5"
                                )}
                                onClick={() => handleSelectTrack(track.id)}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-gray-900">{track.order}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {track.nameKo || track.nameEn || "(제목 없음)"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {track.length}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {trackDetails[track.id]?.artists.length 
                                    ? `${trackDetails[track.id].artists.length}명`
                                    : "-"}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleSelectTrack(track.id)
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={(e) => handleDeleteTrack(track.id, e)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 트랙 정보 섹션 */}
                    {selectedTrackId && trackDetails[selectedTrackId] ? (
                      <div className="space-y-6 pt-6 border-t">
                        <h2 className="text-xl font-semibold">트랙 정보</h2>

                        {/* 곡명 */}
                        <Field>
                          <FieldLabel>곡명</FieldLabel>
                          <FieldContent>
                            <div className="space-y-2">
                              {trackDetails[selectedTrackId].names.map((nameField, index) => (
                                <div key={nameField.id} className="flex items-center gap-2">
                                  <div className="relative flex items-center flex-1 rounded-md border border-input bg-background h-10 overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                    <Select
                                      value={nameField.lang}
                                      onValueChange={(value) => {
                                        const newDetails = { ...trackDetails }
                                        const trackDetail = newDetails[selectedTrackId]
                                        const newNames = [...trackDetail.names]
                                        newNames[index] = { ...newNames[index], lang: value }
                                        newDetails[selectedTrackId] = {
                                          ...trackDetail,
                                          names: newNames,
                                        }
                                        setTrackDetails(newDetails)
                                      }}
                                    >
                                      <SelectTrigger className="h-10 border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 rounded-none px-3 py-2 w-auto min-w-[100px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="ko">한국어</SelectItem>
                                        <SelectItem value="en">영어</SelectItem>
                                        <SelectItem value="ja">일본어</SelectItem>
                                        <SelectItem value="zh">중국어</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <div className="h-6 w-px bg-border flex-shrink-0" />
                                    <Input
                                      value={nameField.value}
                                      onChange={(e) => {
                                        const newDetails = { ...trackDetails }
                                        const trackDetail = newDetails[selectedTrackId]
                                        const newNames = [...trackDetail.names]
                                        newNames[index] = { ...newNames[index], value: e.target.value }
                                        newDetails[selectedTrackId] = {
                                          ...trackDetail,
                                          names: newNames,
                                        }
                                        setTrackDetails(newDetails)
                                        
                                        // 트랙 리스트도 업데이트
                                        const updatedTracks = tracks.map(t => {
                                          if (t.id === selectedTrackId) {
                                            const koName = newNames.find(n => n.lang === "ko")?.value || ""
                                            const enName = newNames.find(n => n.lang === "en")?.value || ""
                                            return {
                                              ...t,
                                              nameKo: koName,
                                              nameEn: enName,
                                            }
                                          }
                                          return t
                                        })
                                        setTracks(updatedTracks)
                                      }}
                                      className="flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-3 py-2 h-full"
                                      placeholder="곡명 입력"
                                    />
                                  </div>
                                  {trackDetails[selectedTrackId].names.length > 2 && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-10 w-10"
                                      onClick={() => {
                                        const newDetails = { ...trackDetails }
                                        const trackDetail = newDetails[selectedTrackId]
                                        newDetails[selectedTrackId] = {
                                          ...trackDetail,
                                          names: trackDetail.names.filter((_, i) => i !== index),
                                        }
                                        setTrackDetails(newDetails)
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {index === trackDetails[selectedTrackId].names.length - 1 && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-10 w-10"
                                      onClick={() => {
                                        const newDetails = { ...trackDetails }
                                        const trackDetail = newDetails[selectedTrackId]
                                        newDetails[selectedTrackId] = {
                                          ...trackDetail,
                                          names: [
                                            ...trackDetail.names,
                                            { id: `name-${Date.now()}`, lang: "en", value: "" },
                                          ],
                                        }
                                        setTrackDetails(newDetails)
                                      }}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </FieldContent>
                        </Field>

                        {/* 장르 */}
                        <Field>
                          <FieldLabel>장르</FieldLabel>
                          <FieldContent>
                            <div className="space-y-3">
                              <div className="text-sm text-muted-foreground">
                                장르를 검색 후 선택해 주세요.
                              </div>
                              <div className="relative" ref={trackGenreDropdownRef}>
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                                <Input
                                  value={trackGenreSearchQuery}
                                  onChange={(e) => {
                                    setTrackGenreSearchQuery(e.target.value)
                                    setShowTrackGenreDropdown(true)
                                  }}
                                  onFocus={() => setShowTrackGenreDropdown(true)}
                                  placeholder="장르 검색"
                                  className="pl-9"
                                />
                                {trackGenreSearchQuery && (
                                  <button
                                    onClick={() => {
                                      setTrackGenreSearchQuery("")
                                      setShowTrackGenreDropdown(false)
                                    }}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                                    type="button"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                                {showTrackGenreDropdown && filteredTrackGenres.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                                    {filteredTrackGenres.map((genre) => (
                                      <button
                                        key={genre}
                                        type="button"
                                        onClick={() => {
                                          const newDetails = { ...trackDetails }
                                          const trackDetail = newDetails[selectedTrackId]
                                          if (!trackDetail.genres.includes(genre)) {
                                            newDetails[selectedTrackId] = {
                                              ...trackDetail,
                                              genres: [...trackDetail.genres, genre],
                                            }
                                            setTrackDetails(newDetails)
                                            
                                            // 트랙 리스트도 업데이트
                                            const updatedTracks = tracks.map(t => {
                                              if (t.id === selectedTrackId) {
                                                return {
                                                  ...t,
                                                  genres: [...t.genres, genre],
                                                }
                                              }
                                              return t
                                            })
                                            setTracks(updatedTracks)
                                          }
                                          setTrackGenreSearchQuery("")
                                          setShowTrackGenreDropdown(false)
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                                      >
                                        {genre}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {showTrackGenreDropdown && trackGenreSearchQuery && filteredTrackGenres.length === 0 && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 p-4 text-sm text-muted-foreground text-center">
                                    검색 결과가 없습니다
                                  </div>
                                )}
                              </div>
                              {trackDetails[selectedTrackId].genres.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {trackDetails[selectedTrackId].genres.map((genre) => (
                                    <Badge
                                      key={genre}
                                      variant="secondary"
                                      className="px-3 py-1 text-sm flex items-center gap-1.5"
                                    >
                                      {genre}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newDetails = { ...trackDetails }
                                          const trackDetail = newDetails[selectedTrackId]
                                          newDetails[selectedTrackId] = {
                                            ...trackDetail,
                                            genres: trackDetail.genres.filter(g => g !== genre),
                                          }
                                          setTrackDetails(newDetails)
                                          
                                          // 트랙 리스트도 업데이트
                                          const updatedTracks = tracks.map(t => {
                                            if (t.id === selectedTrackId) {
                                              return {
                                                ...t,
                                                genres: t.genres.filter(g => g !== genre),
                                              }
                                            }
                                            return t
                                          })
                                          setTracks(updatedTracks)
                                        }}
                                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </FieldContent>
                        </Field>

                        {/* 유형 */}
                        <Field>
                          <FieldLabel>유형</FieldLabel>
                          <FieldContent>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={trackDetails[selectedTrackId].type === "AR" ? "default" : "outline"}
                                onClick={() => {
                                  const newDetails = { ...trackDetails }
                                  newDetails[selectedTrackId] = {
                                    ...trackDetails[selectedTrackId],
                                    type: "AR",
                                  }
                                  setTrackDetails(newDetails)
                                }}
                              >
                                AR
                              </Button>
                              <Button
                                type="button"
                                variant={trackDetails[selectedTrackId].type === "MR" ? "default" : "outline"}
                                onClick={() => {
                                  const newDetails = { ...trackDetails }
                                  newDetails[selectedTrackId] = {
                                    ...trackDetails[selectedTrackId],
                                    type: "MR",
                                  }
                                  setTrackDetails(newDetails)
                                }}
                              >
                                MR
                              </Button>
                            </div>
                          </FieldContent>
                        </Field>

                        {/* 성인 여부 */}
                        <Field>
                          <FieldLabel>성인 여부</FieldLabel>
                          <FieldContent>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={trackDetails[selectedTrackId].isAdult === "예" ? "default" : "outline"}
                                onClick={() => {
                                  const newDetails = { ...trackDetails }
                                  newDetails[selectedTrackId] = {
                                    ...trackDetails[selectedTrackId],
                                    isAdult: "예",
                                  }
                                  setTrackDetails(newDetails)
                                }}
                              >
                                예
                              </Button>
                              <Button
                                type="button"
                                variant={trackDetails[selectedTrackId].isAdult === "아니오" ? "default" : "outline"}
                                onClick={() => {
                                  const newDetails = { ...trackDetails }
                                  newDetails[selectedTrackId] = {
                                    ...trackDetails[selectedTrackId],
                                    isAdult: "아니오",
                                  }
                                  setTrackDetails(newDetails)
                                }}
                              >
                                아니오
                              </Button>
                              <Button
                                type="button"
                                variant={trackDetails[selectedTrackId].isAdult === "Clean" ? "default" : "outline"}
                                onClick={() => {
                                  const newDetails = { ...trackDetails }
                                  newDetails[selectedTrackId] = {
                                    ...trackDetails[selectedTrackId],
                                    isAdult: "Clean",
                                  }
                                  setTrackDetails(newDetails)
                                }}
                              >
                                Clean
                              </Button>
                            </div>
                          </FieldContent>
                        </Field>

                        {/* 비트 창작 여부 */}
                        <Field>
                          <FieldLabel>비트 창작 여부</FieldLabel>
                          <FieldContent>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={trackDetails[selectedTrackId].beatCreation === "창작" ? "default" : "outline"}
                                onClick={() => {
                                  const newDetails = { ...trackDetails }
                                  newDetails[selectedTrackId] = {
                                    ...trackDetails[selectedTrackId],
                                    beatCreation: "창작",
                                  }
                                  setTrackDetails(newDetails)
                                }}
                              >
                                창작
                              </Button>
                              <Button
                                type="button"
                                variant={trackDetails[selectedTrackId].beatCreation === "구매 포함" ? "default" : "outline"}
                                onClick={() => {
                                  const newDetails = { ...trackDetails }
                                  newDetails[selectedTrackId] = {
                                    ...trackDetails[selectedTrackId],
                                    beatCreation: "구매 포함",
                                  }
                                  setTrackDetails(newDetails)
                                }}
                              >
                                구매 포함
                              </Button>
                            </div>
                          </FieldContent>
                        </Field>

                        {/* 가사 */}
                        <Field>
                          <FieldLabel>가사</FieldLabel>
                          <FieldContent>
                            <Textarea
                              value={trackDetails[selectedTrackId].lyrics}
                              onChange={(e) => {
                                const newDetails = { ...trackDetails }
                                newDetails[selectedTrackId] = {
                                  ...trackDetails[selectedTrackId],
                                  lyrics: e.target.value,
                                }
                                setTrackDetails(newDetails)
                              }}
                              className="min-h-[120px]"
                              placeholder="가사를 입력해주세요"
                            />
                          </FieldContent>
                        </Field>

                        {/* 음원 파일 업로드 */}
                        <Field>
                          <FieldLabel>음원 파일 업로드</FieldLabel>
                          <FieldContent>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  // TODO: 파일 선택 기능 구현
                                }}
                              >
                                파일 선택
                              </Button>
                              <Input
                                value={trackDetails[selectedTrackId].audioFile || ""}
                                readOnly
                                placeholder="음원 파일을 선택해주세요"
                                className="flex-1"
                              />
                            </div>
                          </FieldContent>
                        </Field>

                        {/* 하이라이트 구간 설정 */}
                        <Field>
                          <FieldLabel>하이라이트 구간 설정</FieldLabel>
                          <FieldContent>
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                value={trackDetails[selectedTrackId].highlightStart}
                                onChange={(e) => {
                                  const newDetails = { ...trackDetails }
                                  newDetails[selectedTrackId] = {
                                    ...trackDetails[selectedTrackId],
                                    highlightStart: e.target.value,
                                  }
                                  setTrackDetails(newDetails)
                                }}
                                placeholder="00:00:00"
                                className="w-32"
                              />
                              <span className="text-muted-foreground">-</span>
                              <Input
                                type="text"
                                value={trackDetails[selectedTrackId].highlightEnd}
                                onChange={(e) => {
                                  const newDetails = { ...trackDetails }
                                  newDetails[selectedTrackId] = {
                                    ...trackDetails[selectedTrackId],
                                    highlightEnd: e.target.value,
                                  }
                                  setTrackDetails(newDetails)
                                }}
                                placeholder="00:00:00"
                                className="w-32"
                              />
                            </div>
                          </FieldContent>
                        </Field>

                        {/* 뮤직비디오 파일 업로드 */}
                        <Field>
                          <FieldLabel>뮤직비디오 파일 업로드</FieldLabel>
                          <FieldContent>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  // TODO: 파일 선택 기능 구현
                                }}
                              >
                                파일 선택
                              </Button>
                              <Input
                                value={trackDetails[selectedTrackId].videoFile || ""}
                                readOnly
                                placeholder="뮤직비디오가 있는 경우 동영상 파일(MP4)을 업로드해 주세요."
                                className="flex-1"
                              />
                            </div>
                          </FieldContent>
                        </Field>

                        {/* 참여 아티스트 */}
                        <Field>
                          <FieldLabel>참여 아티스트</FieldLabel>
                          <FieldContent>
                            <div className="space-y-2">
                              {(trackDetails[selectedTrackId].artists.length === 0 
                                ? [{ id: `artist-empty-${selectedTrackId}`, roleId: "", roleName: "", value: "" }]
                                : trackDetails[selectedTrackId].artists
                              ).map((artist, index) => {
                                const actualIndex = trackDetails[selectedTrackId].artists.length === 0 ? 0 : index
                                return (
                                <div key={artist.id} className="flex items-center gap-2">
                                  <div className="relative flex items-center flex-1 rounded-md border border-input bg-background h-10 overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                    <Select
                                      value={artist.roleName || ""}
                                      onValueChange={(value) => {
                                        const newDetails = { ...trackDetails }
                                        const trackDetail = newDetails[selectedTrackId]
                                        // 빈 배열인 경우 새로 추가
                                        const newArtists = trackDetail.artists.length === 0
                                          ? [{ id: `artist-${Date.now()}`, roleId: value, roleName: value, value: "" }]
                                          : [...trackDetail.artists]
                                        
                                        if (trackDetail.artists.length > 0) {
                                          newArtists[actualIndex] = {
                                            ...newArtists[actualIndex],
                                            roleId: value,
                                            roleName: value,
                                          }
                                        }
                                        
                                        newDetails[selectedTrackId] = {
                                          ...trackDetail,
                                          artists: newArtists,
                                        }
                                        setTrackDetails(newDetails)
                                      }}
                                    >
                                      <SelectTrigger className="h-10 border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 rounded-none px-3 py-2 w-auto min-w-[150px]">
                                        <SelectValue placeholder="역할 선택" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(rolesByCategory).map(([category, categoryRoles]) => (
                                          <div key={category}>
                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                              {category}
                                            </div>
                                            {categoryRoles.map((roleName) => (
                                              <SelectItem key={roleName} value={roleName}>
                                                {roleName}
                                              </SelectItem>
                                            ))}
                                          </div>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <div className="h-6 w-px bg-border flex-shrink-0" />
                                    <Input
                                      value={artist.value}
                                      readOnly
                                      onClick={() => {
                                        setCurrentArtistIndex(actualIndex)
                                        setSelectedMemberId(null)
                                        setCustomArtistName("")
                                        setArtistDialogOpen(true)
                                      }}
                                      className="flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-3 py-2 h-full cursor-pointer"
                                      placeholder="아티스트명 입력 (클릭하여 선택)"
                                    />
                                  </div>
                                  {trackDetails[selectedTrackId].artists.length > 1 && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-10 w-10"
                                      onClick={() => {
                                        const newDetails = { ...trackDetails }
                                        const trackDetail = newDetails[selectedTrackId]
                                        newDetails[selectedTrackId] = {
                                          ...trackDetail,
                                          artists: trackDetail.artists.filter((_, i) => i !== actualIndex),
                                        }
                                        setTrackDetails(newDetails)
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                )
                              })}
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                  const newDetails = { ...trackDetails }
                                  const trackDetail = newDetails[selectedTrackId]
                                  newDetails[selectedTrackId] = {
                                    ...trackDetail,
                                    artists: [
                                      ...trackDetail.artists,
                                      { id: `artist-${Date.now()}`, roleId: "", roleName: "", value: "" },
                                    ],
                                  }
                                  setTrackDetails(newDetails)
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </FieldContent>
                        </Field>
                      </div>
                    ) : (
                      <div className="pt-6 border-t">
                        <p className="text-muted-foreground text-center py-8">
                          트랙을 선택하거나 새 트랙을 추가하세요.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 참여 아티스트 선택 다이얼로그 */}
                <Dialog open={artistDialogOpen} onOpenChange={setArtistDialogOpen}>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>참여 아티스트 선택</DialogTitle>
                      <DialogDescription>
                        프로젝트 멤버를 선택하거나 직접 입력하여 추가하세요.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      {/* 프로젝트 멤버 선택 */}
                      <div className="space-y-2">
                        <Label>프로젝트 멤버</Label>
                        <ScrollArea className="h-48 rounded-md border p-2">
                          {projectMembers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              프로젝트 멤버가 없습니다.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {projectMembers.map((member) => {
                                const memberName = member.profile?.full_name || member.profile?.nickname || member.profile?.email || "이름 없음"
                                const isSelected = selectedMemberId === member.user_id
                                
                                return (
                                  <div
                                    key={member.id}
                                    className={cn(
                                      "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                                      isSelected
                                        ? "bg-primary/10 border border-primary"
                                        : "hover:bg-accent"
                                    )}
                                    onClick={() => {
                                      setSelectedMemberId(member.user_id)
                                      setCustomArtistName("")
                                    }}
                                  >
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                                      <AvatarFallback>
                                        {memberName.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{memberName}</p>
                                      {member.profile?.email && (
                                        <p className="text-xs text-muted-foreground">{member.profile.email}</p>
                                      )}
                                    </div>
                                    {isSelected && (
                                      <Check className="h-4 w-4 text-primary" />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </ScrollArea>
                      </div>

                      {/* 직접 입력 */}
                      <div className="space-y-2">
                        <Label>또는 직접 입력</Label>
                        <Input
                          value={customArtistName}
                          onChange={(e) => {
                            setCustomArtistName(e.target.value)
                            setSelectedMemberId(null)
                          }}
                          placeholder="아티스트명을 직접 입력하세요"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setArtistDialogOpen(false)
                          setSelectedMemberId(null)
                          setCustomArtistName("")
                        }}
                      >
                        취소
                      </Button>
                      <Button
                        onClick={() => {
                          if (currentArtistIndex === null || !selectedTrackId) return
                          
                          let artistName = ""
                          if (selectedMemberId) {
                            const member = projectMembers.find(m => m.user_id === selectedMemberId)
                            artistName = member?.profile?.full_name || member?.profile?.nickname || member?.profile?.email || ""
                          } else if (customArtistName.trim()) {
                            artistName = customArtistName.trim()
                          }
                          
                          if (artistName) {
                            const newDetails = { ...trackDetails }
                            const trackDetail = newDetails[selectedTrackId]
                            const newArtists = [...trackDetail.artists]
                            
                            if (newArtists.length === 0) {
                              newArtists.push({ id: `artist-${Date.now()}`, roleId: "", roleName: "", value: artistName })
                            } else {
                              newArtists[currentArtistIndex] = {
                                ...newArtists[currentArtistIndex],
                                value: artistName,
                              }
                            }
                            
                            newDetails[selectedTrackId] = {
                              ...trackDetail,
                              artists: newArtists,
                            }
                            setTrackDetails(newDetails)
                            
                            // 트랙 리스트의 아티스트 정보도 업데이트
                            const updatedTracks = tracks.map(t => {
                              if (t.id === selectedTrackId) {
                                const artistNames = newArtists.map(a => a.value).filter(Boolean).join(", ")
                                return {
                                  ...t,
                                  artists: artistNames || "",
                                }
                              }
                              return t
                            })
                            setTracks(updatedTracks)
                          }
                          
                          setArtistDialogOpen(false)
                          setSelectedMemberId(null)
                          setCustomArtistName("")
                        }}
                        disabled={!selectedMemberId && !customArtistName.trim()}
                      >
                        확인
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* 유통·권리 탭 */}
                {activeApplicationTab === "distribution" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">유통·권리 정보</h2>
                    
                    {/* 유통 설정 */}
                    <Card>
                      <CardContent className="p-6 space-y-6">
                        <h3 className="text-lg font-semibold">유통 설정</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Field>
                            <FieldLabel>유통 방식</FieldLabel>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="digital">디지털</SelectItem>
                                <SelectItem value="physical">피지컬 포함</SelectItem>
                                <SelectItem value="both">둘 다</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field>
                            <FieldLabel>유통 범위</FieldLabel>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="domestic">국내</SelectItem>
                                <SelectItem value="global">글로벌</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field>
                            <FieldLabel>서비스 채널</FieldLabel>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="streaming">스트리밍</SelectItem>
                                <SelectItem value="download">다운로드</SelectItem>
                                <SelectItem value="both">둘 다</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field>
                            <FieldLabel>발매일(희망)</FieldLabel>
                            <Input type="date" />
                          </Field>

                          <Field>
                            <FieldLabel>사전공개(프리세이브/프리오더)</FieldLabel>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">사용</SelectItem>
                                <SelectItem value="no">미사용</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field>
                            <FieldLabel>독점 유통 여부</FieldLabel>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="exclusive">독점</SelectItem>
                                <SelectItem value="non-exclusive">비독점</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>

                        {/* 독점 시 추가 필드 */}
                        <div className="space-y-4 pt-4 border-t">
                          <Field>
                            <FieldLabel>독점 기간(개월)</FieldLabel>
                            <Input type="number" placeholder="개월 수 입력" />
                          </Field>
                          <Field>
                            <FieldLabel>갱신 방식</FieldLabel>
                            <Input placeholder="갱신 방식 입력" />
                          </Field>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 권리 소유·대리 권한 */}
                    <Card>
                      <CardContent className="p-6 space-y-6">
                        <h3 className="text-lg font-semibold">권리 소유·대리 권한</h3>
                        
                        <Field>
                          <FieldLabel>마스터 권리자(음반제작자)</FieldLabel>
                          <div className="space-y-3">
                            <Input placeholder="마스터 권리자 입력" />
                            <div className="flex items-center space-x-2">
                              <Checkbox id="same-as-account" />
                              <Label htmlFor="same-as-account" className="text-sm font-normal cursor-pointer">
                                내 계정과 동일
                              </Label>
                            </div>
                          </div>
                        </Field>

                        <Field>
                          <FieldLabel>권리 대리 신청 여부</FieldLabel>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="own">본인 권리</SelectItem>
                              <SelectItem value="proxy">대리 신청</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>

                        {/* 대리 신청 시 추가 필드 */}
                        <div className="space-y-4 pt-4 border-t">
                          <Field>
                            <FieldLabel>위임 근거</FieldLabel>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="contract">계약</SelectItem>
                                <SelectItem value="proxy-letter">위임장</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field>
                            <FieldLabel>대리 범위</FieldLabel>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox id="proxy-distribution" />
                                <Label htmlFor="proxy-distribution" className="text-sm font-normal cursor-pointer">
                                  유통
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="proxy-settlement" />
                                <Label htmlFor="proxy-settlement" className="text-sm font-normal cursor-pointer">
                                  정산
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="proxy-claim" />
                                <Label htmlFor="proxy-claim" className="text-sm font-normal cursor-pointer">
                                  클레임
                                </Label>
                              </div>
                            </div>
                          </Field>
                        </div>

                        <Field>
                          <FieldLabel>아티스트(명칭) 권리 사용 동의</FieldLabel>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="artist-rights-consent" />
                              <Label htmlFor="artist-rights-consent" className="text-sm font-normal cursor-pointer">
                                동의
                              </Label>
                            </div>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="책임 주체 선택" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="representative">대표</SelectItem>
                                <SelectItem value="manager">매니저</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </Field>
                      </CardContent>
                    </Card>

                    {/* 트랙 권리 상태 */}
                    <Card>
                      <CardContent className="p-6 space-y-6">
                        <h3 className="text-lg font-semibold">트랙 권리 상태</h3>
                        
                        <div className="space-y-4">
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-semibold">트랙명</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold">권리 상태</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold">추가 정보</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tracks.map((track) => (
                                  <tr key={track.id} className="border-t">
                                    <td className="px-4 py-3">{track.nameKo || track.nameEn || "트랙명"}</td>
                                    <td className="px-4 py-3">
                                      <Select>
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="original">오리지널</SelectItem>
                                          <SelectItem value="remake">리메이크/커버</SelectItem>
                                          <SelectItem value="sample">샘플 사용</SelectItem>
                                          <SelectItem value="remix">리믹스</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Button variant="outline" size="sm">
                                        상세 입력
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 저작권·출판(퍼블리싱) 정보 */}
                    <Card>
                      <CardContent className="p-6 space-y-6">
                        <h3 className="text-lg font-semibold">저작권·출판(퍼블리싱) 정보</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Field>
                            <FieldLabel>저작권 단체 등록 상태</FieldLabel>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="registered">등록</SelectItem>
                                <SelectItem value="not-registered">미등록</SelectItem>
                                <SelectItem value="in-progress">진행 중</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field>
                            <FieldLabel>신탁 단체</FieldLabel>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="komca">KOMCA</SelectItem>
                                <SelectItem value="koscap">KOSCAP</SelectItem>
                                <SelectItem value="other">기타</SelectItem>
                                <SelectItem value="none">없음</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field>
                            <FieldLabel>작사/작곡자 정보 자동 연동</FieldLabel>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="auto-link-credits" />
                              <Label htmlFor="auto-link-credits" className="text-sm font-normal cursor-pointer">
                                트랙 크레딧에서 불러오기
                              </Label>
                            </div>
                          </Field>

                          <Field>
                            <FieldLabel>출판사(퍼블리셔) 존재</FieldLabel>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">있음</SelectItem>
                                <SelectItem value="no">없음</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>

                        {/* 출판사 있음 시 추가 필드 */}
                        <div className="space-y-4 pt-4 border-t">
                          <Field>
                            <FieldLabel>출판사명</FieldLabel>
                            <Input placeholder="출판사명 입력" />
                          </Field>
                          <Field>
                            <FieldLabel>담당자</FieldLabel>
                            <Input placeholder="담당자 입력" />
                          </Field>
                          <Field>
                            <FieldLabel>퍼블리싱 권리 범위</FieldLabel>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox id="publishing-domestic" />
                                <Label htmlFor="publishing-domestic" className="text-sm font-normal cursor-pointer">
                                  국내
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="publishing-overseas" />
                                <Label htmlFor="publishing-overseas" className="text-sm font-normal cursor-pointer">
                                  해외
                                </Label>
                              </div>
                            </div>
                          </Field>
                          <Field>
                            <FieldLabel>계약/증빙</FieldLabel>
                            <Input type="file" />
                          </Field>
                        </div>

                        <Field>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="no-lyrics-issue" />
                            <Label htmlFor="no-lyrics-issue" className="text-sm font-normal cursor-pointer">
                              가사 권리 이슈: 표절·분쟁 가능성 없음 확인
                            </Label>
                          </div>
                        </Field>
                      </CardContent>
                    </Card>

                    {/* 지역·플랫폼 권리 제한 */}
                    <Card>
                      <CardContent className="p-6 space-y-6">
                        <h3 className="text-lg font-semibold">지역·플랫폼 권리 제한</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Field>
                            <FieldLabel>권리 제한 국가/지역</FieldLabel>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">없음</SelectItem>
                                <SelectItem value="yes">있음(국가 선택)</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field>
                            <FieldLabel>제외 플랫폼</FieldLabel>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">없음</SelectItem>
                                <SelectItem value="yes">있음(플랫폼 선택)</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field>
                            <FieldLabel>기간 제한</FieldLabel>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">없음</SelectItem>
                                <SelectItem value="yes">있음</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>

                        {/* 기간 제한 있음 시 추가 필드 */}
                        <div className="space-y-4 pt-4 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field>
                              <FieldLabel>시작일</FieldLabel>
                              <Input type="date" />
                            </Field>
                            <Field>
                              <FieldLabel>종료일</FieldLabel>
                              <Input type="date" />
                            </Field>
                          </div>
                        </div>

                        <Field>
                          <FieldLabel>선공개/선유통 계약</FieldLabel>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">없음</SelectItem>
                              <SelectItem value="yes">있음</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>

                        {/* 선공개/선유통 계약 있음 시 추가 필드 */}
                        <div className="space-y-4 pt-4 border-t">
                          <Field>
                            <FieldLabel>내용 요약</FieldLabel>
                            <Textarea placeholder="내용 요약 입력" rows={3} />
                          </Field>
                          <Field>
                            <FieldLabel>증빙</FieldLabel>
                            <Input type="file" />
                          </Field>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 식별자·메타데이터(권리 연동) */}
                    <Card>
                      <CardContent className="p-6 space-y-6">
                        <h3 className="text-lg font-semibold">식별자·메타데이터(권리 연동)</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Field>
                            <FieldLabel>UPC</FieldLabel>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">있음</SelectItem>
                                <SelectItem value="no">없음(유통사 발급 요청)</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field>
                            <FieldLabel>ISRC(트랙별)</FieldLabel>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">있음</SelectItem>
                                <SelectItem value="no">없음(유통사 발급 요청)</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field>
                            <FieldLabel>저작물 코드/관리번호</FieldLabel>
                            <Input placeholder="KOMCA 작품번호 등 입력" />
                          </Field>

                          <Field>
                            <FieldLabel>저작권 표기문(Copyright line)</FieldLabel>
                            <Input placeholder="저작권 표기문 입력" />
                          </Field>

                          <Field>
                            <FieldLabel>음반제작자 표기(P-line)</FieldLabel>
                            <Input placeholder="음반제작자 표기 입력" />
                          </Field>

                          <Field>
                            <FieldLabel>레이블명/배급명</FieldLabel>
                            <Input placeholder="레이블명/배급명 입력" />
                          </Field>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 법적 확인·리스크 체크 */}
                    <Card>
                      <CardContent className="p-6 space-y-6">
                        <h3 className="text-lg font-semibold">법적 확인·리스크 체크</h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-start space-x-2">
                            <Checkbox id="legal-1" className="mt-1" />
                            <Label htmlFor="legal-1" className="text-sm font-normal cursor-pointer leading-relaxed">
                              본 콘텐츠는 타인의 권리를 침해하지 않음
                            </Label>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Checkbox id="legal-2" className="mt-1" />
                            <Label htmlFor="legal-2" className="text-sm font-normal cursor-pointer leading-relaxed">
                              필요한 라이선스(커버/샘플/리믹스) 확보 완료
                            </Label>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Checkbox id="legal-3" className="mt-1" />
                            <Label htmlFor="legal-3" className="text-sm font-normal cursor-pointer leading-relaxed">
                              참여자 전원 수익 배분 합의 완료
                            </Label>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Checkbox id="legal-4" className="mt-1" />
                            <Label htmlFor="legal-4" className="text-sm font-normal cursor-pointer leading-relaxed">
                              향후 분쟁 발생 시 책임 주체 확인(대표/권리자)
                            </Label>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Checkbox id="legal-5" className="mt-1" />
                            <Label htmlFor="legal-5" className="text-sm font-normal cursor-pointer leading-relaxed">
                              증빙 자료 제출 동의(요청 시)
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

              </div>

              {/* 오른쪽 컬럼: 신청 상태 및 액션 */}
              <div className="hidden lg:block w-[320px] flex-shrink-0">
                <div className="sticky top-6">
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      {/* 탭 메뉴 */}
                      <div className="space-y-1">
                        {[
                          { id: "artist" as ApplicationTab, label: "아티스트·신청자", status: "작성 중", statusBg: "bg-green-100", statusText: "text-green-700" },
                          { id: "album" as ApplicationTab, label: "앨범", status: "작성 중", statusBg: "bg-green-100", statusText: "text-green-700" },
                          { id: "tracks" as ApplicationTab, label: "수록곡", status: "작성 전", statusBg: "bg-orange-100", statusText: "text-orange-700" },
                          { id: "distribution" as ApplicationTab, label: "유통·권리", status: "작성 전", statusBg: "bg-orange-100", statusText: "text-orange-700" },
                        ].map((tab) => {
                          const isActive = tab.id === activeApplicationTab
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveApplicationTab(tab.id)}
                              className={cn(
                                "w-full flex items-center justify-between px-2 py-2 text-sm rounded-md transition-colors text-left outline-none focus-visible:ring-0",
                                isActive
                                  ? "bg-primary/5 font-semibold text-primary"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              <span>{tab.label}</span>
                              <Badge className={cn("border-0 !transition-none hover:!bg-opacity-100 hover:!text-opacity-100 [&:hover]:bg-opacity-100 [&:hover]:text-opacity-100", tab.statusBg, tab.statusText)}>
                                {tab.status}
                              </Badge>
                            </button>
                          )
                        })}
                      </div>
                      
                      {/* 액션 버튼 */}
                      <div className="space-y-2">
                        <Button className="w-full h-10">
                          제안 받기
                        </Button>
                        <Button variant="outline" className="w-full h-10">
                          임시 저장
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 받은 제안 탭 */}
        {activeSubTab === "proposal" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-4">
              {/* 받은 제안 섹션 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">받은 제안</h2>
                    <Badge>3</Badge>
                  </div>
                </div>
                
                {/* 제안 카드 목록 */}
                <div className="space-y-6">
                  {/* 울림뮤직 엔터테인먼트 */}
                  <div className="space-y-2">
                    {/* 헤더: 아이콘, 회사명, 타임스탬프 - 카드 밖 */}
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={getPublisherImageUrl("141775.jpg")} />
                        <AvatarFallback className="bg-amber-100">
                          <span className="text-xs font-semibold text-amber-700">울</span>
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex items-center justify-between">
                        <p className="font-medium">울림뮤직 엔터테인먼트</p>
                        <p className="text-xs text-muted-foreground">2025-10-28 17:25:48</p>
                      </div>
                    </div>
                    
                    {/* 카드: 정보 필드와 버튼 */}
                    <Card 
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => router.push(`/console/${artistCode}/projects/${projectCode}/release/woollim`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-4 text-sm">
                          <div className="flex-1">
                            <span className="text-muted-foreground">발매 가능일</span>
                            <p className="font-semibold mt-0.5">2025-11-14 부터</p>
                          </div>
                          <div className="w-full h-px md:h-12 md:w-px bg-border flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">발매 국가</span>
                            <p className="font-semibold mt-0.5">대한민국 외 21개</p>
                          </div>
                          <div className="w-full h-px md:h-12 md:w-px bg-border flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">발매 플랫폼</span>
                            <p className="font-semibold mt-0.5">Melon 외 15개</p>
                          </div>
                          <div className="w-full h-px md:h-12 md:w-px bg-border flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">유통 수수료</span>
                            <p className="font-semibold mt-0.5">20%</p>
                          </div>
                          <div className="w-full h-px md:h-12 md:w-px bg-border flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">최초 계약 기간</span>
                            <p className="font-semibold mt-0.5">2년</p>
                          </div>
                          <div className="w-full h-px md:h-12 md:w-px bg-border flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">정산 주기 / 최소 정산금</span>
                            <p className="font-semibold mt-0.5">1개월 / 40,000원</p>
                          </div>
                          {!isMobile && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 ml-auto">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 아날로그 엔터테인먼트 */}
                  <div className="space-y-2">
                    {/* 헤더: 아이콘, 회사명, 타임스탬프 - 카드 밖 */}
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={getPublisherImageUrl("1992.jpg")} />
                        <AvatarFallback className="bg-amber-100">
                          <span className="text-xs font-semibold text-amber-700">아</span>
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex items-center justify-between">
                        <p className="font-medium">아날로그 엔터테인먼트</p>
                        <p className="text-xs text-muted-foreground">2025-10-27 15:37:16</p>
                      </div>
                    </div>
                    
                    {/* 카드: 정보 필드와 버튼 */}
                    <Card 
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => router.push(`/console/${artistCode}/projects/${projectCode}/release/analog`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-4 text-sm">
                          <div className="flex-1">
                            <span className="text-muted-foreground">발매 가능일</span>
                            <p className="font-semibold mt-0.5">2025-11-11 부터</p>
                          </div>
                          <div className="w-full h-px md:h-12 md:w-px bg-border flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">발매 국가</span>
                            <p className="font-semibold mt-0.5">전 세계</p>
                          </div>
                          <div className="w-full h-px md:h-12 md:w-px bg-border flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">발매 플랫폼</span>
                            <p className="font-semibold mt-0.5">Apple Music 외 21곳</p>
                          </div>
                          <div className="w-full h-px md:h-12 md:w-px bg-border flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">유통 수수료</span>
                            <p className="font-semibold mt-0.5">20%</p>
                          </div>
                          <div className="w-full h-px md:h-12 md:w-px bg-border flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">최초 계약 기간</span>
                            <p className="font-semibold mt-0.5">2년</p>
                          </div>
                          <div className="w-full h-px md:h-12 md:w-px bg-border flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">정산 주기 / 최소 정산금</span>
                            <p className="font-semibold mt-0.5">1개월 / 50,000원</p>
                          </div>
                          {!isMobile && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 ml-auto">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 트리뮤직앤아트 */}
                  <div className="space-y-2">
                    {/* 헤더: 아이콘, 회사명, 타임스탬프 - 카드 밖 */}
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-amber-100">
                          <span className="text-xs font-semibold text-amber-700">트</span>
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex items-center justify-between">
                        <p className="font-medium">트리뮤직앤아트</p>
                        <p className="text-xs text-muted-foreground">2025-10-24 14:27:57</p>
                      </div>
                    </div>
                    
                    {/* 카드: 정보 필드와 버튼 */}
                    <Card 
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => router.push(`/console/${artistCode}/projects/${projectCode}/release/tree`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-4 text-sm">
                          <div className="flex-1">
                            <span className="text-muted-foreground">발매 가능일</span>
                            <p className="font-semibold mt-0.5">2025-10-29 부터</p>
                          </div>
                          <div className="w-full h-px md:h-12 md:w-px bg-border flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">발매 국가</span>
                            <p className="font-semibold mt-0.5">전 세계</p>
                          </div>
                          <div className="w-full h-px md:h-12 md:w-px bg-border flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">발매 플랫폼</span>
                            <p className="font-semibold mt-0.5">Apple Music 외 21곳</p>
                          </div>
                          <div className="w-full h-px md:h-12 md:w-px bg-border flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">유통 수수료</span>
                            <p className="font-semibold mt-0.5">15%</p>
                          </div>
                          <div className="w-full h-px md:h-12 md:w-px bg-border flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">최초 계약 기간</span>
                            <p className="font-semibold mt-0.5">1년</p>
                          </div>
                          <div className="w-full h-px md:h-12 md:w-px bg-border flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">정산 주기 / 최소 정산금</span>
                            <p className="font-semibold mt-0.5">3개월 / 없음</p>
                          </div>
                          {!isMobile && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 ml-auto">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* 검토 중 섹션 */}
                <div className="flex items-center justify-center gap-3 pt-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-background">
                      <span className="text-xs font-semibold">S</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-background -ml-2">
                      <span className="text-xs">♪</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-background -ml-2">
                      <span className="text-xs font-semibold">S</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-background -ml-2">
                      <span className="text-xs">•</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">아직 유통사 19곳이 검토 중이에요.</p>
                </div>
              </div>

              {/* 거절 섹션 */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">거절</h2>
                  <Badge>2</Badge>
                </div>
                
                <div className="space-y-3">
                  {/* 오렌지뮤직 */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={getPublisherImageUrl("35389.jpg")} />
                          <AvatarFallback className="bg-muted">
                            <span className="text-xs font-semibold text-muted-foreground">오</span>
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">오렌지뮤직</p>
                          <p className="text-xs text-muted-foreground">2025-10-26 17:28:24</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          내부 심사 기준에 부합하지 않음
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 뮤즈플랫폼 */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={getPublisherImageUrl("580.jpg")} />
                          <AvatarFallback className="bg-muted">
                            <span className="text-xs text-muted-foreground">♪</span>
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">뮤즈플랫폼</p>
                          <p className="text-xs text-muted-foreground">2025-10-25 12:37:42</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          내부 심사 기준에 부합하지 않음
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 다른 서브 탭 컨텐츠 */}
        {activeSubTab !== "status" && activeSubTab !== "application" && activeSubTab !== "proposal" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <p className="text-muted-foreground text-center py-8">
                {releaseSubTabs.find(t => t.id === activeSubTab)?.label} 기능은 준비 중입니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

