"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { useArtistContext } from "@/hooks/use-artist-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/lib/toast"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/heic']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

const SNS_PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'naver', label: '네이버 블로그' },
  { id: 'website', label: 'Website' },
  { id: 'soundcloud', label: 'Soundcloud' },
  { id: 'weverse', label: 'Weverse' },
]

const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: '영어' },
  { code: 'ja', label: '일본어' },
  { code: 'zh', label: '중국어' },
  { code: 'es', label: '스페인어' },
  { code: 'fr', label: '프랑스어' },
  { code: 'de', label: '독일어' },
  { code: 'pt', label: '포르투갈어' },
  { code: 'ru', label: '러시아어' },
  { code: 'it', label: '이탈리아어' },
]

const GENRES = {
  '팝': ['메인스트림 팝', '인디팝', '신스팝', '드림팝', '팝록', '파워팝', '틴팝', '일렉트로팝'],
  '발라드': ['K-발라드', '팝발라드', '락발라드', 'R&B 발라드', '피아노 발라드', '어쿠스틱 발라드'],
  '록': ['클래식 록', '얼터너티브 록', '인디 록', '하드 록', '포스트록', '개러지 록', '사이키델릭 록', '프로그레시브 록'],
  '메탈': ['헤비 메탈', '스래시 메탈', '데스 메탈', '블랙 메탈', '파워 메탈', '메탈코어', '프로그 메탈'],
  '펑크/하드코어': ['펑크 록', '하드코어 펑크', '팝펑크', '포스트펑크', '이모', '스카펑크'],
  '힙합/랩': ['붐뱁', '트랩', '드릴', '로파이 힙합', '컨셔스/언더그라운드', '멜로딕 랩', '하이퍼힙합'],
  'R&B/소울': ['컨템포러리 R&B', '네오 소울', '얼터너티브 R&B', '소울', '콰이어/하모니 소울', 'R&B 발라드'],
  '재즈': ['스탠더드 재즈', '비밥', '스윙', '쿨 재즈', '퓨전 재즈', '재즈 보컬', '스무스 재즈', '라틴 재즈'],
  '블루스': ['델타 블루스', '시카고 블루스', '블루스 록', '컨템포러리 블루스'],
  '펑크/디스코': ['펑크', '디스코', '뉴디스코', '소울펑크', '고고/그루브'],
  '일렉트로닉/EDM': ['EDM', '일렉트로', '브레이크비트', '글리치', '퓨처베이스', '빅룸', '하드댄스'],
  '하우스': ['딥하우스', '테크하우스', '프로그 하우스', '디스코 하우스', '개러지 하우스'],
  '테크노': ['멜로딕 테크노', '미니멀 테크노', '하드 테크노', '인더스트리얼 테크노'],
  '트랜스': ['업리프팅 트랜스', '프로그 트랜스', '사이 트랜스'],
  '베이스/UK': ['드럼앤베이스', '리퀴드 DnB', '정글', '덥스텝', 'UK 개러지', '그라임'],
  '앰비언트/칠': ['앰비언트', '칠아웃', '로파이', '다운템포', '드론'],
  '실험/아방가르드': ['노이즈', '프리/즉흥', '사운드아트', '인더스트리얼', '하이퍼팝(실험 계열)'],
  '포크/어쿠스틱': ['포크', '인디 포크', '싱어송라이터', '어쿠스틱 팝', '컨템포러리 포크'],
  '컨트리': ['컨트리', '아메리카나', '블루그래스', '컨트리 팝', '컨트리 록'],
  '레게/스카': ['레게', '루츠 레게', '댄스홀', '더브', '스카'],
  '라틴': ['레게톤', '살사', '바차타', '메렝게', '라틴 팝', '브라질리언(삼바/보사노바)'],
  '월드/전통': ['아프로비트', '중동/아랍', '인도/남아시아', '동유럽/발칸', '켈틱'],
  '국악/퓨전 국악': ['정통 국악', '판소리/민요 기반', '창작 국악', '퓨전 국악', '국악 재즈/국악 일렉트로닉'],
  '트로트/성인가요': ['정통 트로트', '세미 트로트', '댄스 트로트', '발라드 트로트'],
  '클래식/현대음악': ['바로크', '고전파', '낭만', '현대 클래식', '실내악', '합창/성악', '피아노 솔로'],
  'OST/스코어': ['드라마 OST', '영화 OST', '게임 OST', '오케스트라 스코어', '앰비언트 스코어'],
  '기독교/가스펠': ['CCM', '가스펠', '워십', '찬송가 편곡'],
  '키즈/가족': ['동요', '교육/놀이', '자장가'],
  '장르 혼합': [],
  '미정': [],
  '기타(직접 입력)': [],
}

const MAIN_GENRES = Object.keys(GENRES)

const ARTIST_TYPES = [
  '솔로 아티스트',
  '싱어송라이터',
  '밴드',
  '듀오/트리오',
  '그룹(보컬/퍼포먼스 중심)',
  '래퍼/힙합 아티스트',
  '프로듀서/비트메이커',
  '디제이',
  '작곡가/작사가 팀',
  '연주자(세션/솔로)',
  '합창/앙상블',
  '크루/컬렉티브',
  '레이블/프로젝트 팀',
  '기타(직접 입력)',
]

type LanguageCode = string

export function ArtistProfileTab() {
  const params = useParams()
  const { artists, loading, activeArtist, updateArtist, refetch } = useArtistContext()
  const artistCode = params.artistCode as string
  
  // 현재 아티스트 찾기
  const currentArtist = artists.find((a) => a.artist_code === artistCode) || activeArtist
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverImageInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  
  // 초기값 저장 (변경사항 비교용)
  const initialValuesRef = useRef<{
    names: Record<LanguageCode, string>
    languageFields: Array<{ id: string; lang: LanguageCode }>
    description: string
    agency: string
    debutDate: Date | null
    mainGenre: string
    subGenre: string
    customGenre: string
    artistType: string
    customArtistType: string
    sns: Record<string, string>
    snsFields: Array<{ id: string; platform: string }>
    tags: string[]
    iconUrl: string | null
    coverImageUrl: string | null
  } | null>(null)
  
  // 폼 데이터
  const [names, setNames] = useState<Record<LanguageCode, string>>({
    ko: "",
    en: "",
  })
  // 모든 언어 필드를 하나의 배열로 관리 (기본: 한국어, 영어)
  const [languageFields, setLanguageFields] = useState<Array<{ id: string; lang: LanguageCode }>>([
    { id: "lang-1", lang: "ko" },
    { id: "lang-2", lang: "en" },
  ])
  const [description, setDescription] = useState("")
  const [agency, setAgency] = useState("")
  const [debutDate, setDebutDate] = useState<Date | null>(null)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [mainGenre, setMainGenre] = useState("")
  const [subGenre, setSubGenre] = useState("")
  const [customGenre, setCustomGenre] = useState("")
  const [artistType, setArtistType] = useState("")
  const [customArtistType, setCustomArtistType] = useState("")
  const [sns, setSns] = useState<Record<string, string>>({
    instagram: "",
    twitter: "",
  })
  // SNS 필드를 동적으로 관리 (기본: 2개, 최소 2개)
  const [snsFields, setSnsFields] = useState<Array<{ id: string; platform: string }>>([
    { id: "sns-1", platform: "instagram" },
    { id: "sns-2", platform: "twitter" },
  ])
  
  // 태그
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  
  // 프로필 이미지
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  
  // 커버 이미지
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [coverImageError, setCoverImageError] = useState<string | null>(null)

  // 아티스트 데이터 로드
  useEffect(() => {
    if (currentArtist) {
      // names JSONB에서 다국어 이름 로드
      let loadedNames: Record<LanguageCode, string> = {}
      
      if (currentArtist.names && typeof currentArtist.names === 'object') {
        // names JSONB에서 모든 언어 로드
        loadedNames = { ...currentArtist.names } as Record<LanguageCode, string>
        
        // names에서 언어 필드 구성 (한국어 우선 정렬)
        const languageKeys = Object.keys(loadedNames)
        // 한국어를 먼저, 그 다음 영어, 나머지는 알파벳 순
        const sortedKeys = [
          ...languageKeys.filter(lang => lang === 'ko'),
          ...languageKeys.filter(lang => lang === 'en'),
          ...languageKeys.filter(lang => lang !== 'ko' && lang !== 'en').sort()
        ]
        
        const loadedLanguageFields = sortedKeys.map((lang, index) => ({
          id: `lang-${index + 1}`,
          lang: lang as LanguageCode,
        }))
        
        // 최소 2개 필드 유지 (없으면 ko, en 추가)
        if (loadedLanguageFields.length === 0) {
          setLanguageFields([
            { id: "lang-1", lang: "ko" },
            { id: "lang-2", lang: "en" },
          ])
        } else if (loadedLanguageFields.length === 1) {
          // 한국어가 없으면 한국어 추가, 있으면 영어 추가
          const hasKo = loadedLanguageFields.some(lf => lf.lang === 'ko')
          if (hasKo) {
            setLanguageFields([
              ...loadedLanguageFields,
              { id: "lang-2", lang: "en" },
            ])
          } else {
            setLanguageFields([
              { id: "lang-1", lang: "ko" },
              ...loadedLanguageFields,
            ])
          }
        } else {
          setLanguageFields(loadedLanguageFields)
        }
      } else {
        // names가 없으면 기본값으로 초기화
        loadedNames = {
          ko: "",
          en: "",
        }
        
        setLanguageFields([
          { id: "lang-1", lang: "ko" },
          { id: "lang-2", lang: "en" },
        ])
      }
      
      setNames(loadedNames)
      setDescription(currentArtist.description || "")
      setAgency(currentArtist.agency || "")
      // 데뷔일 로드
      const loadedDebutDate = currentArtist.debut_date 
        ? new Date(currentArtist.debut_date) 
        : null
      setDebutDate(loadedDebutDate)
      // 장르 로드
      setMainGenre(currentArtist.main_genre || "")
      setSubGenre(currentArtist.sub_genre || "")
      setCustomGenre(currentArtist.custom_genre || "")
      // 아티스트 유형 로드
      setArtistType(currentArtist.artist_type || "")
      setCustomArtistType(currentArtist.custom_artist_type || "")
      const loadedSns = currentArtist.sns || {}
      setSns(loadedSns)
      
      // SNS 필드 구성 (최소 2개 유지)
      const snsKeys = Object.keys(loadedSns)
      const loadedSnsFields = snsKeys.map((platform, index) => ({
        id: `sns-${index + 1}`,
        platform: platform,
      }))
      
      // 최소 2개 필드 유지
      if (loadedSnsFields.length === 0) {
        setSnsFields([
          { id: "sns-1", platform: "instagram" },
          { id: "sns-2", platform: "twitter" },
        ])
        setSns({ ...loadedSns, instagram: "", twitter: "" })
      } else if (loadedSnsFields.length === 1) {
        // 1개만 있으면 하나 더 추가
        const hasInstagram = loadedSnsFields.some(sf => sf.platform === 'instagram')
        if (hasInstagram) {
          setSnsFields([
            ...loadedSnsFields,
            { id: "sns-2", platform: "twitter" },
          ])
          setSns({ ...loadedSns, twitter: "" })
        } else {
          setSnsFields([
            { id: "sns-1", platform: "instagram" },
            ...loadedSnsFields,
          ])
          setSns({ ...loadedSns, instagram: "" })
        }
      } else {
        setSnsFields(loadedSnsFields)
      }
      
      // 태그 로드
      const loadedTags = currentArtist.tags || []
      setTags(loadedTags)
      
      setProfileImagePreview(currentArtist.icon_url || null)
      setCoverImagePreview(currentArtist.cover_image_url || null)
      
      // 초기값 저장 (변경사항 비교용)
      // languageFields와 snsFields는 setState가 비동기이므로, 실제로 설정된 값이 아닌 로드된 값을 사용
      let finalLanguageFields: Array<{ id: string; lang: LanguageCode }>
      if (currentArtist.names && typeof currentArtist.names === 'object') {
        const languageKeys = Object.keys(loadedNames)
        const sortedKeys = [
          ...languageKeys.filter(lang => lang === 'ko'),
          ...languageKeys.filter(lang => lang === 'en'),
          ...languageKeys.filter(lang => lang !== 'ko' && lang !== 'en').sort()
        ]
        const loadedLanguageFields = sortedKeys.map((lang, index) => ({
          id: `lang-${index + 1}`,
          lang: lang as LanguageCode,
        }))
        
        if (loadedLanguageFields.length === 0) {
          finalLanguageFields = [
            { id: "lang-1", lang: "ko" },
            { id: "lang-2", lang: "en" },
          ]
        } else if (loadedLanguageFields.length === 1) {
          const hasKo = loadedLanguageFields.some(lf => lf.lang === 'ko')
          if (hasKo) {
            finalLanguageFields = [
              ...loadedLanguageFields,
              { id: "lang-2", lang: "en" },
            ]
          } else {
            finalLanguageFields = [
              { id: "lang-1", lang: "ko" },
              ...loadedLanguageFields,
            ]
          }
        } else {
          finalLanguageFields = loadedLanguageFields
        }
      } else {
        finalLanguageFields = [
          { id: "lang-1", lang: "ko" },
          { id: "lang-2", lang: "en" },
        ]
      }
      
      let finalSnsFields: Array<{ id: string; platform: string }>
      if (loadedSnsFields.length === 0) {
        finalSnsFields = [
          { id: "sns-1", platform: "instagram" },
          { id: "sns-2", platform: "twitter" },
        ]
      } else if (loadedSnsFields.length === 1) {
        const hasInstagram = loadedSnsFields.some(sf => sf.platform === 'instagram')
        if (hasInstagram) {
          finalSnsFields = [
            ...loadedSnsFields,
            { id: "sns-2", platform: "twitter" },
          ]
        } else {
          finalSnsFields = [
            { id: "sns-1", platform: "instagram" },
            ...loadedSnsFields,
          ]
        }
      } else {
        finalSnsFields = loadedSnsFields
      }
      
      initialValuesRef.current = {
        names: { ...loadedNames },
        languageFields: finalLanguageFields,
        description: currentArtist.description || "",
        agency: currentArtist.agency || "",
        debutDate: loadedDebutDate,
        mainGenre: currentArtist.main_genre || "",
        subGenre: currentArtist.sub_genre || "",
        customGenre: currentArtist.custom_genre || "",
        artistType: currentArtist.artist_type || "",
        customArtistType: currentArtist.custom_artist_type || "",
        sns: { ...loadedSns },
        snsFields: finalSnsFields,
        tags: loadedTags,
        iconUrl: currentArtist.icon_url || null,
        coverImageUrl: currentArtist.cover_image_url || null,
      }
    }
  }, [currentArtist])
  
  // 변경사항 확인 함수
  const hasChanges = (): boolean => {
    if (!initialValuesRef.current || !currentArtist) return false
    
    const initial = initialValuesRef.current
    
    // 프로필 이미지 변경 확인
    if (profileImage) return true // 새 이미지가 선택됨
    if (!profileImage && profileImagePreview === null && initial.iconUrl) return true // 이미지가 삭제됨
    
    // 커버 이미지 변경 확인
    if (coverImage) return true // 새 이미지가 선택됨
    if (!coverImage && coverImagePreview === null && initial.coverImageUrl) return true // 이미지가 삭제됨
    
    // names 변경 확인 (languageFields 기준으로 비교)
    const currentNames: Record<string, string> = {}
    languageFields.forEach(langField => {
      const value = names[langField.lang]?.trim() || ""
      if (value) {
        currentNames[langField.lang] = value
      }
    })
    
    const initialNames: Record<string, string> = {}
    initial.languageFields.forEach(langField => {
      const value = initial.names[langField.lang]?.trim() || ""
      if (value) {
        initialNames[langField.lang] = value
      }
    })
    
    // 언어 필드 개수나 순서가 다르면 변경됨
    if (languageFields.length !== initial.languageFields.length) return true
    if (languageFields.some((lf, idx) => lf.lang !== initial.languageFields[idx]?.lang)) return true
    
    // names 값 비교
    const allLangKeys = new Set([...Object.keys(currentNames), ...Object.keys(initialNames)])
    for (const lang of allLangKeys) {
      if ((currentNames[lang] || "") !== (initialNames[lang] || "")) return true
    }
    
    // description 변경 확인
    if ((description.trim() || "") !== (initial.description.trim() || "")) return true
    
    // agency 변경 확인
    if ((agency.trim() || "") !== (initial.agency.trim() || "")) return true
    
    // debutDate 변경 확인
    const currentDebutDateStr = debutDate ? format(debutDate, 'yyyy-MM-dd') : null
    const initialDebutDateStr = initial.debutDate ? format(initial.debutDate, 'yyyy-MM-dd') : null
    if (currentDebutDateStr !== initialDebutDateStr) return true
    
    // 장르 변경 확인
    if ((mainGenre.trim() || "") !== (initial.mainGenre.trim() || "")) return true
    if ((subGenre.trim() || "") !== (initial.subGenre.trim() || "")) return true
    if ((customGenre.trim() || "") !== (initial.customGenre.trim() || "")) return true
    
    // 아티스트 유형 변경 확인
    if ((artistType.trim() || "") !== (initial.artistType.trim() || "")) return true
    if ((customArtistType.trim() || "") !== (initial.customArtistType.trim() || "")) return true
    
    // sns 변경 확인 (snsFields 기준으로 비교)
    const currentSns: Record<string, string> = {}
    snsFields.forEach(snsField => {
      const value = (sns[snsField.platform] || "").trim()
      if (value) {
        currentSns[snsField.platform] = value
      }
    })
    
    const initialSns: Record<string, string> = {}
    initial.snsFields.forEach(snsField => {
      const value = (initial.sns[snsField.platform] || "").trim()
      if (value) {
        initialSns[snsField.platform] = value
      }
    })
    
    // SNS 필드 개수나 순서가 다르면 변경됨
    if (snsFields.length !== initial.snsFields.length) return true
    if (snsFields.some((sf, idx) => sf.platform !== initial.snsFields[idx]?.platform)) return true
    
    // sns 값 비교
    const allSnsKeys = new Set([...Object.keys(currentSns), ...Object.keys(initialSns)])
    for (const platform of allSnsKeys) {
      if ((currentSns[platform] || "") !== (initialSns[platform] || "")) return true
    }
    
    // tags 변경 확인
    const currentTags = [...tags].sort()
    const initialTags = [...(initial.tags || [])].sort()
    if (currentTags.length !== initialTags.length) return true
    if (currentTags.some((tag, idx) => tag !== initialTags[idx])) return true
    
    return false
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("jpg, jpeg, png, webp, avif, heic 파일만 업로드 가능합니다.")
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("파일 크기는 5MB 이하여야 합니다.")
      return
    }

    setImageError(null)
    setProfileImage(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = async () => {
    // 기존에 저장된 이미지가 있으면 스토리지에서 삭제
    if (currentArtist?.icon_url && currentArtist.icon_url.includes('/artist-images/')) {
      try {
        const supabase = createClient()
        const urlParts = currentArtist.icon_url.split('/artist-images/')
        if (urlParts.length > 1) {
          const oldFileName = urlParts[1].split('?')[0] // 쿼리 파라미터 제거
          if (oldFileName) {
            await supabase.storage
              .from('avatars')
              .remove([`artist-images/${oldFileName}`])
              .catch((err) => {
                console.warn("기존 이미지 삭제 실패:", err)
              })
          }
        }
      } catch (err) {
        console.warn("기존 이미지 삭제 실패:", err)
      }
    }
    
    setProfileImage(null)
    setProfileImagePreview(null)
    setImageError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setCoverImageError("jpg, jpeg, png, webp, avif, heic 파일만 업로드 가능합니다.")
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setCoverImageError("파일 크기는 5MB 이하여야 합니다.")
      return
    }

    setCoverImageError(null)
    setCoverImage(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveCoverImage = async () => {
    // 기존에 저장된 이미지가 있으면 스토리지에서 삭제
    if (currentArtist?.cover_image_url && currentArtist.cover_image_url.includes('/cover-images/')) {
      try {
        const supabase = createClient()
        const urlParts = currentArtist.cover_image_url.split('/cover-images/')
        if (urlParts.length > 1) {
          const oldFileName = urlParts[1].split('?')[0] // 쿼리 파라미터 제거
          if (oldFileName) {
            await supabase.storage
              .from('avatars')
              .remove([`cover-images/${oldFileName}`])
              .catch((err) => {
                console.warn("기존 커버 이미지 삭제 실패:", err)
              })
          }
        }
      } catch (err) {
        console.warn("기존 커버 이미지 삭제 실패:", err)
      }
    }
    
    setCoverImage(null)
    setCoverImagePreview(null)
    setCoverImageError(null)
    if (coverImageInputRef.current) {
      coverImageInputRef.current.value = ""
    }
  }

  const handleSnsChange = (platform: string, value: string) => {
    setSns(prev => {
      const updated = { ...prev }
      if (value.trim()) {
        updated[platform] = value.trim()
      } else {
        delete updated[platform]
      }
      return updated
    })
  }

  const handleAddSns = () => {
    const usedPlatforms = snsFields.map(sf => sf.platform)
    const availablePlatforms = SNS_PLATFORMS.filter(
      platform => !usedPlatforms.includes(platform.id)
    )
    
    if (availablePlatforms.length === 0) {
      toast.error("추가할 수 있는 SNS 플랫폼이 없습니다")
      return
    }
    
    const newId = `sns-${Date.now()}-${Math.random()}`
    setSnsFields([...snsFields, { id: newId, platform: availablePlatforms[0].id }])
    setSns({ ...sns, [availablePlatforms[0].id]: "" })
  }

  const handleRemoveSns = (id: string, platform: string) => {
    // 최소 2개의 필드는 유지해야 함
    if (snsFields.length <= 2) {
      return
    }
    
    setSnsFields(snsFields.filter(sf => sf.id !== id))
    const newSns = { ...sns }
    delete newSns[platform]
    setSns(newSns)
  }

  const handleSnsPlatformChange = (id: string, oldPlatform: string, newPlatform: string) => {
    // 이미 다른 필드에서 사용 중인 플랫폼인지 확인
    if (snsFields.some(sf => sf.platform === newPlatform && sf.id !== id)) {
      return
    }
    
    const newSnsFields = snsFields.map(sf => 
      sf.id === id ? { ...sf, platform: newPlatform } : sf
    )
    setSnsFields(newSnsFields)
    
    const newSns = { ...sns }
    const value = newSns[oldPlatform] || ""
    delete newSns[oldPlatform]
    if (value) {
      newSns[newPlatform] = value
    }
    setSns(newSns)
  }

  const handleSnsUrlChange = (platform: string, value: string) => {
    handleSnsChange(platform, value)
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (!trimmedTag) return
    
    // 중복 확인
    if (tags.includes(trimmedTag)) {
      toast.error("이미 추가된 태그입니다")
      setTagInput("")
      return
    }
    
    // 10개 제한 확인
    if (tags.length >= 10) {
      toast.error("태그는 최대 10개까지 추가할 수 있습니다")
      setTagInput("")
      return
    }
    
    setTags([...tags, trimmedTag])
    setTagInput("")
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleAddLanguage = () => {
    const usedLanguages = languageFields.map(lf => lf.lang)
    const availableLanguages = LANGUAGES.filter(
      lang => !usedLanguages.includes(lang.code)
    )
    
    if (availableLanguages.length === 0) {
      toast.error("추가할 수 있는 언어가 없습니다")
      return
    }
    
    const newId = `lang-${Date.now()}-${Math.random()}`
    setLanguageFields([...languageFields, { id: newId, lang: availableLanguages[0].code }])
    setNames({ ...names, [availableLanguages[0].code]: "" })
  }

  const handleRemoveLanguage = (id: string, langCode: LanguageCode) => {
    // 최소 2개의 필드는 유지해야 함
    if (languageFields.length <= 2) {
      return
    }
    
    setLanguageFields(languageFields.filter(lf => lf.id !== id))
    const newNames = { ...names }
    delete newNames[langCode]
    setNames(newNames)
  }

  const handleLanguageChange = (id: string, oldLang: LanguageCode, newLang: LanguageCode) => {
    // 이미 다른 필드에서 사용 중인 언어인지 확인
    if (languageFields.some(lf => lf.lang === newLang && lf.id !== id)) {
      return
    }
    
    const newLanguageFields = languageFields.map(lf => 
      lf.id === id ? { ...lf, lang: newLang } : lf
    )
    setLanguageFields(newLanguageFields)
    
    const newNames = { ...names }
    const value = newNames[oldLang] || ""
    delete newNames[oldLang]
    newNames[newLang] = value
    setNames(newNames)
  }

  const handleNameChange = (langCode: LanguageCode, value: string) => {
    setNames({ ...names, [langCode]: value })
  }

  const handleSave = async () => {
    if (!currentArtist) {
      toast.error("아티스트를 찾을 수 없습니다")
      return
    }

    const firstLanguage = languageFields[0]
    if (!names[firstLanguage?.lang]?.trim()) {
      toast.error("첫 번째 언어 이름을 입력해주세요")
      return
    }

    if (saving) return

    setSaving(true)
    try {
      const supabase = createClient()
      let iconUrl: string | undefined = currentArtist.icon_url || undefined
      let coverImageUrl: string | undefined = currentArtist.cover_image_url || undefined

      // 커버 이미지 업로드
      if (coverImage) {
        // 데모 사용자 확인
        const demoUser = getDemoUser()
        let userId: string
        
        if (demoUser) {
          userId = DEMO_USER_ID
          console.log('[ArtistProfileTab] 데모 사용자 모드 - 커버 이미지 업로드:', userId)
        } else {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error("로그인이 필요합니다")
          userId = user.id
        }

        // 기존 이미지 삭제 (있는 경우)
        if (currentArtist.cover_image_url && currentArtist.cover_image_url.includes('/cover-images/')) {
          try {
            // URL에서 파일 경로 추출
            const urlParts = currentArtist.cover_image_url.split('/cover-images/')
            if (urlParts.length > 1) {
              const oldFileName = urlParts[1].split('?')[0] // 쿼리 파라미터 제거
              if (oldFileName) {
                await supabase.storage
                  .from('avatars')
                  .remove([`cover-images/${oldFileName}`])
                  .catch((err) => {
                    // 삭제 실패는 무시 (이미 삭제되었거나 없는 파일일 수 있음)
                    console.warn("기존 커버 이미지 삭제 실패:", err)
                  })
              }
            }
          } catch (err) {
            console.warn("기존 커버 이미지 삭제 실패:", err)
          }
        }

        const fileExt = coverImage.name.split('.').pop()
        const fileName = `artist-${userId}-${Date.now()}.${fileExt}`
        const filePath = `cover-images/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, coverImage, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('커버 이미지 업로드 오류:', uploadError)
          throw new Error(`커버 이미지 업로드 실패: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath)

        coverImageUrl = urlData.publicUrl
      } else if (!coverImage && coverImagePreview === null && currentArtist.cover_image_url) {
        // 이미지가 삭제된 경우 - 기존 이미지를 스토리지에서 삭제
        if (currentArtist.cover_image_url.includes('/cover-images/')) {
          try {
            const urlParts = currentArtist.cover_image_url.split('/cover-images/')
            if (urlParts.length > 1) {
              const oldFileName = urlParts[1].split('?')[0]
              if (oldFileName) {
                await supabase.storage
                  .from('avatars')
                  .remove([`cover-images/${oldFileName}`])
                  .catch((err) => {
                    console.warn("기존 커버 이미지 삭제 실패:", err)
                  })
              }
            }
          } catch (err) {
            console.warn("기존 커버 이미지 삭제 실패:", err)
          }
        }
        coverImageUrl = undefined
      }

      // 프로필 이미지 업로드
      if (profileImage) {
        // 데모 사용자 확인
        const demoUser = getDemoUser()
        let userId: string
        
        if (demoUser) {
          userId = DEMO_USER_ID
          console.log('[ArtistProfileTab] 데모 사용자 모드 - 아티스트 이미지 업로드:', userId)
        } else {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error("로그인이 필요합니다")
          userId = user.id
        }

        // 기존 이미지 삭제 (있는 경우)
        if (currentArtist.icon_url && currentArtist.icon_url.includes('/artist-images/')) {
          try {
            // URL에서 파일 경로 추출
            const urlParts = currentArtist.icon_url.split('/artist-images/')
            if (urlParts.length > 1) {
              const oldFileName = urlParts[1].split('?')[0] // 쿼리 파라미터 제거
              if (oldFileName) {
                await supabase.storage
                  .from('avatars')
                  .remove([`artist-images/${oldFileName}`])
                  .catch((err) => {
                    // 삭제 실패는 무시 (이미 삭제되었거나 없는 파일일 수 있음)
                    console.warn("기존 이미지 삭제 실패:", err)
                  })
              }
            }
          } catch (err) {
            console.warn("기존 이미지 삭제 실패:", err)
          }
        }

        const fileExt = profileImage.name.split('.').pop()
        const fileName = `artist-${userId}-${Date.now()}.${fileExt}`
        const filePath = `artist-images/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, profileImage, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('이미지 업로드 오류:', uploadError)
          throw new Error(`이미지 업로드 실패: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath)

        iconUrl = urlData.publicUrl
      } else if (!profileImage && profileImagePreview === null && currentArtist.icon_url) {
        // 이미지가 삭제된 경우 - 기존 이미지를 스토리지에서 삭제
        if (currentArtist.icon_url.includes('/artist-images/')) {
          try {
            const urlParts = currentArtist.icon_url.split('/artist-images/')
            if (urlParts.length > 1) {
              const oldFileName = urlParts[1].split('?')[0]
              if (oldFileName) {
                await supabase.storage
                  .from('avatars')
                  .remove([`artist-images/${oldFileName}`])
                  .catch((err) => {
                    console.warn("기존 이미지 삭제 실패:", err)
                  })
              }
            }
          } catch (err) {
            console.warn("기존 이미지 삭제 실패:", err)
          }
        }
        iconUrl = undefined
      }

      // 아티스트 정보 업데이트
      // 모든 언어를 names JSONB에 저장
      const namesToSave: Record<string, string> = {}
      languageFields.forEach(langField => {
        const value = names[langField.lang]?.trim()
        if (value) {
          namesToSave[langField.lang] = value
        }
      })
      
      await updateArtist(currentArtist.id, {
        names: Object.keys(namesToSave).length > 0 ? namesToSave : null,
        description: description.trim() || null,
        agency: agency.trim() || null,
        debut_date: debutDate ? format(debutDate, 'yyyy-MM-dd') : null,
        main_genre: mainGenre.trim() || null,
        sub_genre: subGenre.trim() || null,
        custom_genre: customGenre.trim() || null,
        artist_type: artistType.trim() || null,
        custom_artist_type: customArtistType.trim() || null,
        sns: Object.keys(sns).length > 0 ? sns : null,
        tags: tags.length > 0 ? tags : null,
        icon_url: iconUrl || null,
        cover_image_url: coverImageUrl || null,
      })

      // 아티스트 목록 새로고침
      await refetch()

      toast.success("아티스트 정보가 저장되었습니다")
      
      // 이미지 상태 초기화
      setProfileImage(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setCoverImage(null)
      if (coverImageInputRef.current) {
        coverImageInputRef.current.value = ""
      }
      
      // 저장 후 초기값 업데이트
      const namesToSaveForRef: Record<string, string> = {}
      languageFields.forEach(langField => {
        const value = names[langField.lang]?.trim()
        if (value) {
          namesToSaveForRef[langField.lang] = value
        }
      })
      
      if (initialValuesRef.current) {
        initialValuesRef.current = {
          names: { ...namesToSaveForRef },
          languageFields: [...languageFields],
          description: description.trim() || "",
          agency: agency.trim() || "",
          debutDate: debutDate,
          mainGenre: mainGenre.trim() || "",
          subGenre: subGenre.trim() || "",
          customGenre: customGenre.trim() || "",
          artistType: artistType.trim() || "",
          customArtistType: customArtistType.trim() || "",
          sns: { ...sns },
          snsFields: [...snsFields],
          tags: [...tags],
          iconUrl: iconUrl || null,
          coverImageUrl: coverImageUrl || null,
        }
      }
      
      // 프로필 이미지 프리뷰 업데이트
      if (iconUrl) {
        setProfileImagePreview(iconUrl)
      } else if (iconUrl === null) {
        setProfileImagePreview(null)
      }
      
      // 커버 이미지 프리뷰 업데이트
      if (coverImageUrl) {
        setCoverImagePreview(coverImageUrl)
      } else if (coverImageUrl === null) {
        setCoverImagePreview(null)
      }
    } catch (err: any) {
      console.error("아티스트 정보 저장 실패:", err)
      toast.error(err.message || "아티스트 정보 저장에 실패했습니다")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">아티스트 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!currentArtist) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <p className="text-lg font-medium">아티스트를 찾을 수 없습니다</p>
          <p className="text-sm text-muted-foreground">
            {artists.length === 0 
              ? "아직 생성된 아티스트 스페이스가 없습니다. 새로 만들어보세요!" 
              : "요청하신 아티스트 스페이스를 찾을 수 없습니다."}
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
            >
              뒤로 가기
            </Button>
            {artists.length === 0 && (
              <Button onClick={() => refetch()}>
                새로고침
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-2xl space-y-6">
          {/* 헤더 */}
          <div>
            <h2 className="text-2xl font-semibold">아티스트 정보</h2>
          </div>

          {/* 커버 이미지 */}
          <Field>
            <FieldLabel>
              커버 이미지{" "}
              <span className="text-xs text-muted-foreground font-normal">(선택)</span>
            </FieldLabel>
            <FieldContent>
              <div className="space-y-2">
                <div 
                  className="relative w-full cursor-pointer group"
                  style={{ aspectRatio: '16/3' }}
                  onClick={() => coverImageInputRef.current?.click()}
                >
                  {coverImagePreview ? (
                    <img
                      src={coverImagePreview}
                      alt="커버 미리보기"
                      className="w-full h-full object-cover rounded-lg border-2 border-border"
                      style={{ aspectRatio: '16/3' }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden" style={{ aspectRatio: '16/3' }}>
                      <span className="text-sm text-muted-foreground">커버 이미지 추가 (16:3 비율)</span>
                    </div>
                  )}
                </div>
                <input
                  ref={coverImageInputRef}
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(",")}
                  onChange={handleCoverImageSelect}
                  className="hidden"
                />
                <div className="text-sm text-muted-foreground">
                  이미지 파일(png, jpg 등) 업로드<br></br>
                  최대 5MB까지 가능, 권장 비율: 16:3
                </div>
                {coverImageError && <FieldError>{coverImageError}</FieldError>}
                <div className="flex gap-1">
                  {coverImage || coverImagePreview ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => coverImageInputRef.current?.click()}
                      >
                        변경
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={handleRemoveCoverImage}
                      >
                        삭제
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => coverImageInputRef.current?.click()}
                    >
                      추가
                    </Button>
                  )}
                </div>
              </div>
            </FieldContent>
          </Field>

          {/* 프로필 이미지 */}
          <Field>
            <FieldLabel>
              프로필 이미지{" "}
              <span className="text-xs text-muted-foreground font-normal">(선택)</span>
            </FieldLabel>
            <FieldContent>
              <div className="flex gap-4 items-center">
                <div 
                  className="relative flex-shrink-0 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="프로필 미리보기"
                      className="w-24 h-24 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(",")}
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="text-sm text-muted-foreground">
                    이미지 파일(png, jpg 등) 업로드<br></br>
                    최대 5MB까지 가능
                  </div>
                  {imageError && <FieldError>{imageError}</FieldError>}
                  <div className="flex gap-1 mt-1">
                    {profileImage || profileImagePreview ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          변경
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={handleRemoveImage}
                        >
                          삭제
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        추가
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </FieldContent>
          </Field>

          {/* 아티스트명 다국어 */}
          <Field>
            <FieldLabel>
              아티스트명 <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <div className="space-y-1">
                {/* 모든 언어 필드 */}
                {languageFields.map((langField, index) => {
                  const langInfo = LANGUAGES.find(l => l.code === langField.lang)
                  const isLast = index === languageFields.length - 1
                  
                  // 현재 필드를 제외한 모든 선택된 언어 목록
                  const usedLanguages = languageFields
                    .filter(lf => lf.id !== langField.id)
                    .map(lf => lf.lang)
                  
                  const hasAddButton = isLast
                  const hasRemoveButton = languageFields.length > 2 && langField.lang !== 'ko'
                  const hasButtons = hasAddButton || hasRemoveButton
                  
                  return (
                    <div key={langField.id} className={`flex items-center w-full ${hasButtons ? 'gap-2' : ''}`}>
                      <div className="relative flex items-center flex-1 rounded-md border border-input bg-background h-10 overflow-hidden focus-within:ring-0">
                        {/* 언어 선택 드롭다운 (왼쪽) */}
                        <div className="flex-shrink-0">
                          <Select
                            value={langField.lang}
                            onValueChange={(value) => handleLanguageChange(langField.id, langField.lang, value)}
                          >
                            <SelectTrigger className="h-10 border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 rounded-none px-3 py-2 w-auto min-w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LANGUAGES.map((lang) => {
                                // 이미 다른 필드에서 사용 중인 언어는 선택 불가
                                const isUsed = usedLanguages.includes(lang.code)
                                const isCurrent = lang.code === langField.lang
                                
                                return (
                                  <SelectItem 
                                    key={lang.code} 
                                    value={lang.code}
                                    disabled={isUsed && !isCurrent}
                                  >
                                    {lang.label}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* 구분선 */}
                        <div className="h-6 w-px bg-border flex-shrink-0" />
                        {/* 텍스트 입력 필드 (오른쪽) */}
                        <Input
                          value={names[langField.lang] || ""}
                          onChange={(e) => handleNameChange(langField.lang, e.target.value)}
                          placeholder={`${langInfo?.label || ''} 이름을 입력하세요`}
                          maxLength={50}
                          className="flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-3 py-2 h-full"
                        />
                      </div>
                      {hasButtons && (
                        <div className="flex gap-1 flex-shrink-0">
                          {hasAddButton && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10"
                              onClick={handleAddLanguage}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          {hasRemoveButton && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => handleRemoveLanguage(langField.id, langField.lang)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </FieldContent>
          </Field>

          {/* 아티스트 유형 */}
          <Field>
            <FieldLabel>아티스트 유형</FieldLabel>
            <FieldContent>
              <Select
                value={artistType}
                onValueChange={(value) => {
                  setArtistType(value)
                  // 기타(직접 입력)가 아니면 직접 입력 필드 초기화
                  if (value !== '기타(직접 입력)') {
                    setCustomArtistType("")
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="아티스트 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {ARTIST_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 직접 입력 필드 (기타 선택 시 표시) */}
              {artistType === '기타(직접 입력)' && (
                <div className="mt-0">
                  <Input
                    value={customArtistType}
                    onChange={(e) => setCustomArtistType(e.target.value)}
                    placeholder="아티스트 유형을 직접 입력하세요"
                    maxLength={50}
                  />
                </div>
              )}
            </FieldContent>
          </Field>

          {/* 아티스트 소개 */}
          <Field>
            <FieldLabel>아티스트 소개</FieldLabel>
            <FieldContent>
              <div className="relative">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="아티스트에 대한 소개를 입력하세요"
                  rows={5}
                  maxLength={500}
                  className="pr-16"
                />
                <p className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {description.length}/500
                </p>
              </div>
            </FieldContent>
          </Field>

          {/* 대표 장르/세부장르 */}
          <Field>
            <FieldLabel>대표 장르/세부 장르</FieldLabel>
            <FieldContent>
              <div className="flex gap-2">
                {/* 대표 장르 */}
                <div className="flex-1">
                  <Select
                    value={mainGenre}
                    onValueChange={(value) => {
                      setMainGenre(value)
                      // 기타(직접 입력)가 아니면 세부장르 초기화
                      if (value !== '기타(직접 입력)') {
                        setSubGenre("")
                        setCustomGenre("")
                      } else {
                        setSubGenre("")
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="대표 장르 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAIN_GENRES.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 세부장르 */}
                <div className="flex-1">
                  <Select
                    value={subGenre}
                    onValueChange={(value) => setSubGenre(value)}
                    disabled={!mainGenre || mainGenre === '기타(직접 입력)' || mainGenre === '장르 혼합' || mainGenre === '미정'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="세부 장르 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainGenre && GENRES[mainGenre as keyof typeof GENRES]?.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 직접 입력 필드 (기타 선택 시 표시) */}
              {mainGenre === '기타(직접 입력)' && (
                <div className="mt-0">
                  <Input
                    value={customGenre}
                    onChange={(e) => setCustomGenre(e.target.value)}
                    placeholder="장르를 직접 입력하세요"
                    maxLength={50}
                  />
                </div>
              )}
            </FieldContent>
          </Field>

          {/* 데뷔/결성일 */}
          <Field>
            <FieldLabel>데뷔/결성일</FieldLabel>
            <FieldContent>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !debutDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {debutDate ? (
                      format(debutDate, "yyyy년 MM월 dd일", { locale: ko })
                    ) : (
                      <span>날짜를 선택하세요</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={debutDate || undefined}
                    onSelect={(date) => {
                      if (date) {
                        setDebutDate(date)
                      } else {
                        setDebutDate(null)
                      }
                      setIsDatePickerOpen(false)
                    }}
                    locale={ko}
                    captionLayout="dropdown"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
            </FieldContent>
          </Field>

          {/* 기획사 */}
          <Field>
            <FieldLabel>기획사</FieldLabel>
            <FieldContent>
              <Input
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                placeholder="기획사 이름을 입력하세요"
                maxLength={50}
              />
            </FieldContent>
          </Field>

          {/* SNS */}
          <Field>
            <FieldLabel>SNS</FieldLabel>
            <FieldContent>
              <div className="space-y-1">
                {snsFields.map((snsField, index) => {
                  const platformInfo = SNS_PLATFORMS.find(p => p.id === snsField.platform)
                  const isLast = index === snsFields.length - 1
                  
                  // 현재 필드를 제외한 모든 선택된 플랫폼 목록
                  const usedPlatforms = snsFields
                    .filter(sf => sf.id !== snsField.id)
                    .map(sf => sf.platform)
                  
                  const hasAddButton = isLast
                  const hasRemoveButton = snsFields.length > 2
                  const hasButtons = hasAddButton || hasRemoveButton
                  
                  return (
                    <div key={snsField.id} className={`flex items-center w-full ${hasButtons ? 'gap-2' : ''}`}>
                      <div className="relative flex items-center flex-1 rounded-md border border-input bg-background h-10 overflow-hidden focus-within:ring-0">
                        {/* 플랫폼 선택 드롭다운 (왼쪽) */}
                        <div className="flex-shrink-0">
                          <Select
                            value={snsField.platform}
                            onValueChange={(value) => handleSnsPlatformChange(snsField.id, snsField.platform, value)}
                          >
                            <SelectTrigger className="h-10 border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 rounded-none px-3 py-2 w-auto min-w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SNS_PLATFORMS.map((platform) => {
                                // 이미 다른 필드에서 사용 중인 플랫폼은 선택 불가
                                const isUsed = usedPlatforms.includes(platform.id)
                                const isCurrent = platform.id === snsField.platform
                                
                                return (
                                  <SelectItem 
                                    key={platform.id} 
                                    value={platform.id}
                                    disabled={isUsed && !isCurrent}
                                  >
                                    {platform.label}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* 구분선 */}
                        <div className="h-6 w-px bg-border flex-shrink-0" />
                        {/* URL 입력 필드 (오른쪽) */}
                        <Input
                          value={sns[snsField.platform] || ""}
                          onChange={(e) => handleSnsUrlChange(snsField.platform, e.target.value)}
                          placeholder={`${platformInfo?.label || ''} URL`}
                          type="url"
                          className="flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-3 py-2 h-full"
                        />
                      </div>
                      {hasButtons && (
                        <div className="flex gap-1 flex-shrink-0">
                          {hasAddButton && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10"
                              onClick={handleAddSns}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          {hasRemoveButton && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => handleRemoveSns(snsField.id, snsField.platform)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </FieldContent>
          </Field>

          {/* 태그 */}
          <Field>
            <FieldLabel>
              태그{" "}
              <span className="text-xs text-muted-foreground font-normal">
                ({tags.length}/10)
              </span>
            </FieldLabel>
            <FieldContent>
              <div className="space-y-3">
                {/* 태그 입력 */}
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder="태그를 입력하고 Enter를 누르세요"
                    maxLength={30}
                    disabled={tags.length >= 10}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={tags.length >= 10 || !tagInput.trim()}
                  >
                    추가
                  </Button>
                </div>
                
                {/* 태그 목록 */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-sm"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-destructive transition-colors"
                          aria-label={`${tag} 태그 삭제`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FieldContent>
          </Field>

          {/* 저장 버튼 */}
          <div className="pt-4 flex justify-start">
            <Button onClick={handleSave} disabled={saving || !hasChanges()}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

