"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/lib/toast"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldSuccess,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/heic']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_AVATAR_URL = '/assets/BI_symbol.svg' // 기본 프로필 이미지

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
}

export function ProfileTab() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nicknameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [formData, setFormData] = useState<Partial<ProfileData>>({})
  const [birthdate, setBirthdate] = useState<Date | undefined>(undefined)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  
  // 프로필 이미지
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  
  // 닉네임 유효성 검사
  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const [checkingNickname, setCheckingNickname] = useState(false)
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null)
  
  // 주소 검색
  const [isAddressSearchOpen, setIsAddressSearchOpen] = useState(false)
  const [addressSearchKeyword, setAddressSearchKeyword] = useState("")
  const [addressSearchResults, setAddressSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  // 닉네임 중복 확인
  const checkNicknameAvailability = useCallback(async (nicknameToCheck: string) => {
    if (!nicknameToCheck.trim()) {
      setNicknameAvailable(null)
      setNicknameError(null)
      return
    }

    if (nicknameToCheck.length < 2 || nicknameToCheck.length > 20) {
      setNicknameAvailable(null)
      setNicknameError(null)
      return
    }

    // 현재 사용자의 닉네임과 동일하면 유효성 검사 결과를 표시하지 않음
    if (profile && nicknameToCheck.trim() === profile.nickname) {
      setNicknameAvailable(null)
      setNicknameError(null)
      return
    }

    setCheckingNickname(true)
    setNicknameError(null)
    setNicknameAvailable(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("nickname", nicknameToCheck.trim())
        .maybeSingle()

      if (error) {
        console.error('닉네임 확인 쿼리 오류:', error)
        
        // 컬럼이 없는 경우 (PGRST116 또는 42703) - 닉네임 사용 가능으로 처리
        if (error.code === 'PGRST116' || error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
          setNicknameAvailable(true)
          setNicknameError(null)
          return
        }
        
        throw error
      }

      if (data) {
        // 닉네임이 이미 사용 중
        setNicknameAvailable(false)
        setNicknameError("해당 닉네임은 사용할 수 없습니다.")
      } else {
        // 닉네임 사용 가능
        setNicknameAvailable(true)
        setNicknameError(null)
      }
    } catch (err: any) {
      console.error('닉네임 확인 중 예외 발생:', err)
      // 에러가 발생해도 닉네임 사용 가능으로 처리 (DB 문제일 수 있음)
      setNicknameAvailable(true)
      setNicknameError(null)
    } finally {
      setCheckingNickname(false)
    }
  }, [profile])

  // 닉네임 입력 시 자동 중복 검사 (debounce)
  useEffect(() => {
    // 이전 timeout 취소
    if (nicknameCheckTimeoutRef.current) {
      clearTimeout(nicknameCheckTimeoutRef.current)
    }

    const nickname = formData.nickname || ""

    // 입력이 없거나 유효하지 않으면 상태 초기화
    if (!nickname.trim() || nickname.length < 2 || nickname.length > 20) {
      setNicknameAvailable(null)
      setNicknameError(null)
      return
    }

    // 현재 사용자의 닉네임과 동일하면 유효성 검사 결과를 표시하지 않음
    if (profile && nickname.trim() === profile.nickname) {
      setNicknameAvailable(null)
      setNicknameError(null)
      return
    }

    // 500ms 후에 검사 실행
    nicknameCheckTimeoutRef.current = setTimeout(() => {
      checkNicknameAvailability(nickname)
    }, 500)

    // cleanup
    return () => {
      if (nicknameCheckTimeoutRef.current) {
        clearTimeout(nicknameCheckTimeoutRef.current)
      }
    }
  }, [formData.nickname, checkNicknameAvailability, profile])

  // 프로필 이미지 선택
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 타입 확인
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("jpg, jpeg, png, webp, avif, heic 파일만 업로드 가능합니다.")
      return
    }

    // 파일 크기 확인
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("파일 크기는 5MB 이하여야 합니다.")
      return
    }

    setImageError(null)
    setProfileImage(file)
    
    // 미리보기 생성
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 주소 검색
  const searchAddress = async () => {
    if (!addressSearchKeyword.trim()) {
      toast.error("검색어를 입력해주세요.")
      return
    }

    setIsSearching(true)
    setAddressSearchResults([])

    try {
      const response = await fetch(`/api/address-search?keyword=${encodeURIComponent(addressSearchKeyword)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '주소 검색 실패')
      }

      if (data.results?.common?.errorCode === '0') {
        const results = data.results.juso || []
        setAddressSearchResults(results)
        if (results.length === 0) {
          toast.info("검색 결과가 없습니다.")
        }
      } else {
        toast.error(`주소 검색 실패: ${data.results?.common?.errorMessage || '알 수 없는 오류'}`)
      }
    } catch (error: any) {
      console.error('주소 검색 오류:', error)
      toast.error(error.message || "주소 검색 중 오류가 발생했습니다.")
    } finally {
      setIsSearching(false)
    }
  }

  // 주소 선택
  const selectAddress = (address: any) => {
    const zipNo = address.zipNo || ""
    const roadAddr = address.roadAddr || ""
    const jibunAddr = address.jibunAddr || ""
    
    // 주소1 설정 (도로명 주소 우선, 없으면 지번 주소)
    const selectedAddress1 = roadAddr || jibunAddr || ""
    
    // 한 번의 setFormData 호출로 모든 주소 필드 업데이트
    setFormData((prev) => ({
      ...prev,
      zip_code: zipNo,
      address1: selectedAddress1,
      address2: "",
    }))
    
    // 다이얼로그 닫기
    setIsAddressSearchOpen(false)
    setAddressSearchKeyword("")
    setAddressSearchResults([])
  }

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      let userId: string
      
      if (demoUser) {
        userId = DEMO_USER_ID
        console.log('[ProfileTab] 데모 사용자 모드:', userId)
      } else {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          toast.error("로그인이 필요합니다")
          return
        }
        
        userId = user.id
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("프로필 로드 오류:", error)
        toast.error("프로필을 불러오는 중 오류가 발생했습니다")
        return
      }

      if (data) {
        setProfile(data as ProfileData)
        const birthdateDate = data.birthdate ? new Date(data.birthdate) : undefined
        setBirthdate(birthdateDate)
        setFormData({
          nickname: data.nickname || "",
          full_name: data.full_name || "",
          bio: data.bio || "",
          phone: data.phone || "",
          birthdate: data.birthdate || "",
          gender: data.gender || null,
          address1: data.address1 || "",
          address2: data.address2 || "",
          zip_code: data.zip_code || "",
        })
        // 프로필 이미지 미리보기 설정
        if (data.avatar_url) {
          setProfileImagePreview(data.avatar_url)
        } else {
          setProfileImagePreview(null)
        }
        setProfileImage(null) // 새로 선택한 파일은 없음
        // 닉네임 유효성 검사 상태 초기화 (기본 상태)
        setNicknameAvailable(null)
        setNicknameError(null)
      }
    } catch (error) {
      console.error("프로필 로드 중 예외:", error)
      toast.error("프로필을 불러오는 중 오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  // 변경사항 확인
  const hasChanges = useMemo(() => {
    if (!profile) return false

    // 프로필 이미지 변경 확인
    const imageChanged = profileImage !== null || 
      (profileImagePreview !== profile.avatar_url && 
       !(profileImagePreview === null && profile.avatar_url === null))

    // 생년월일 비교
    const currentBirthdate = birthdate ? format(birthdate, 'yyyy-MM-dd') : null
    const profileBirthdate = profile.birthdate || null

    // 각 필드 비교
    const nicknameChanged = (formData.nickname || "") !== (profile.nickname || "")
    const fullNameChanged = (formData.full_name || "") !== (profile.full_name || "")
    const bioChanged = (formData.bio || "") !== (profile.bio || "")
    const phoneChanged = (formData.phone || "") !== (profile.phone || "")
    const birthdateChanged = currentBirthdate !== profileBirthdate
    const genderChanged = (formData.gender || null) !== (profile.gender || null)
    const address1Changed = (formData.address1 || "") !== (profile.address1 || "")
    const address2Changed = (formData.address2 || "") !== (profile.address2 || "")
    const zipCodeChanged = (formData.zip_code || "") !== (profile.zip_code || "")

    return imageChanged || nicknameChanged || fullNameChanged || bioChanged || 
           phoneChanged || birthdateChanged || genderChanged || 
           address1Changed || address2Changed || zipCodeChanged
  }, [profile, formData, birthdate, profileImage, profileImagePreview])

  const handleSave = async () => {
    if (!profile) return

    // 닉네임 유효성 검사
    const nickname = formData.nickname || ""
    if (nickname.trim()) {
      if (nickname.length < 2 || nickname.length > 20) {
        toast.error("닉네임은 2자 이상 20자 이하여야 합니다.")
        return
      }

      if (checkingNickname) {
        toast.error("닉네임 확인이 진행 중입니다. 잠시만 기다려주세요.")
        return
      }

      // 현재 사용자의 닉네임과 다르고, 사용 불가능한 경우
      if (nickname.trim() !== profile.nickname && nicknameAvailable !== true) {
        if (nicknameAvailable === false) {
          toast.error("사용할 수 없는 닉네임입니다.")
          return
        }
        // 아직 확인 중이거나 확인되지 않은 경우
        if (nicknameAvailable === null) {
          toast.error("닉네임 사용 가능 여부를 확인해주세요.")
          return
        }
      }
    }

    setSaving(true)
    try {
      const supabase = createClient()
      
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      let userId: string
      
      if (demoUser) {
        userId = DEMO_USER_ID
        console.log('[ProfileTab Save] 데모 사용자 모드:', userId)
      } else {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          toast.error("로그인이 필요합니다")
          return
        }
        
        userId = user.id
      }

      let avatarUrl: string | null = null

      // 프로필 이미지 업로드
      if (profileImage) {
        try {
          const fileExt = profileImage.name.split('.').pop()
          const fileName = `${userId}-${Date.now()}.${fileExt}`
          const filePath = `profile-images/${fileName}`

          // 기존 프로필 이미지가 있으면 삭제 시도 (실패해도 계속 진행)
          if (profile.avatar_url && profile.avatar_url.includes('/profile-images/')) {
            const oldFileName = profile.avatar_url.split('/profile-images/')[1]
            if (oldFileName) {
              await supabase.storage
                .from("avatars")
                .remove([`profile-images/${oldFileName}`])
                .catch(() => {
                  // 삭제 실패는 무시 (이미 삭제되었거나 없는 파일일 수 있음)
                })
            }
          }

          // avatars 버킷에 업로드 (upsert 사용)
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, profileImage, {
              cacheControl: '3600',
              upsert: true
            })

          if (uploadError) {
            console.error('이미지 업로드 오류:', uploadError)
            
            // RLS 정책 오류인 경우 더 명확한 메시지 제공
            if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('RLS')) {
              throw new Error('이미지 업로드 권한이 없습니다. Supabase Storage 버킷의 RLS 정책을 확인해주세요.')
            }
            
            throw new Error(`이미지 업로드 실패: ${uploadError.message}`)
          }

          // 공개 URL 가져오기
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath)

          avatarUrl = urlData.publicUrl
        } catch (imgError: any) {
          console.error('이미지 업로드 중 오류:', imgError)
          toast.error(imgError.message || "이미지 업로드 중 오류가 발생했습니다")
          return
        }
      } else if (profileImagePreview === null && profile?.avatar_url) {
        // 이미지가 삭제된 경우 - 기존 이미지를 스토리지에서 삭제
        if (profile.avatar_url.includes('/profile-images/')) {
          try {
            const oldFileName = profile.avatar_url.split('/profile-images/')[1]?.split('?')[0]
            if (oldFileName) {
              await supabase.storage
                .from("avatars")
                .remove([`profile-images/${oldFileName}`])
                .catch((err) => {
                  console.warn("기존 이미지 삭제 실패:", err)
                })
            }
          } catch (err) {
            console.warn("기존 이미지 삭제 실패:", err)
          }
        }
        avatarUrl = DEFAULT_AVATAR_URL
      } else {
        // 이미지가 변경되지 않은 경우 기존 URL 유지
        avatarUrl = profile?.avatar_url || null
      }

      // 업데이트할 데이터 준비
      const birthdateString = birthdate ? format(birthdate, 'yyyy-MM-dd') : null
      const updateData: Partial<ProfileData> = {
        nickname: formData.nickname || null,
        full_name: formData.full_name || null,
        bio: formData.bio || null,
        phone: formData.phone || null,
        birthdate: birthdateString,
        gender: formData.gender || null,
        address1: formData.address1 || null,
        address2: formData.address2 || null,
        zip_code: formData.zip_code || null,
        avatar_url: avatarUrl,
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId)

      if (error) {
        console.error("프로필 저장 오류:", error)
        toast.error(error.message || "프로필 저장 중 오류가 발생했습니다")
        return
      }

      toast.success("프로필이 성공적으로 저장되었습니다")
      await loadProfile() // 최신 데이터 다시 로드
      
      // 사이드바 등 다른 컴포넌트에 변경사항 반영을 위해 페이지 새로고침
      router.refresh()
    } catch (error) {
      console.error("프로필 저장 중 예외:", error)
      toast.error("프로필 저장 중 오류가 발생했습니다")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">프로필을 불러오는 중...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">프로필을 불러올 수 없습니다</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">프로필</h2>
          <p className="text-sm text-muted-foreground mt-1">
            계정 프로필 정보를 관리합니다
          </p>
        </div>

        <FieldSet>
          <FieldGroup>
            <div className="space-y-6">
              {/* 프로필 이미지 */}
              <Field orientation="vertical">
                <FieldLabel>
                  프로필 이미지{" "}
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
                      {imageError && (
                        <div className="text-sm text-destructive">{imageError}</div>
                      )}
                      <div className="flex gap-1 mt-1">
                        {profileImage || profileImagePreview ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              변경
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                // 기존에 저장된 이미지가 있으면 스토리지에서 삭제
                                if (profile?.avatar_url && profile.avatar_url.includes('/profile-images/')) {
                                  try {
                                    const supabase = createClient()
                                    const oldFileName = profile.avatar_url.split('/profile-images/')[1]?.split('?')[0]
                                    if (oldFileName) {
                                      await supabase.storage
                                        .from("avatars")
                                        .remove([`profile-images/${oldFileName}`])
                                        .catch((err) => {
                                          console.warn("기존 이미지 삭제 실패:", err)
                                        })
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
                              }}
                            >
                              삭제
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
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

              <Field orientation="vertical">
                <FieldLabel htmlFor="nickname">닉네임</FieldLabel>
                <FieldContent>
                  <Input
                    id="nickname"
                    value={formData.nickname || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, nickname: e.target.value })
                      setNicknameError(null)
                    }}
                    placeholder="닉네임을 입력하세요"
                    variant={
                      nicknameError || nicknameAvailable === false
                        ? "error"
                        : nicknameAvailable === true
                        ? "success"
                        : "default"
                    }
                    disabled={checkingNickname}
                  />
                  {checkingNickname && (
                    <FieldDescription>확인 중...</FieldDescription>
                  )}
                  {!checkingNickname && nicknameAvailable === true && (
                    <FieldSuccess>사용 가능한 닉네임입니다.</FieldSuccess>
                  )}
                  {!checkingNickname && (nicknameAvailable === false || nicknameError) && (
                    <FieldError>{nicknameError || "해당 닉네임은 사용할 수 없습니다."}</FieldError>
                  )}
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldLabel htmlFor="full_name">실명</FieldLabel>
                <FieldContent>
                  <Input
                    id="full_name"
                    value={formData.full_name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    placeholder="실명을 입력하세요"
                  />
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldLabel htmlFor="bio">소개</FieldLabel>
                <FieldContent>
                  <textarea
                    id="bio"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.bio || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="자기소개를 입력하세요"
                  />
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldLabel htmlFor="phone">휴대전화번호</FieldLabel>
                <FieldContent>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="010-1234-5678"
                    maxLength={32}
                  />
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldLabel htmlFor="birthdate">생년월일</FieldLabel>
                <FieldContent>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="birthdate"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !birthdate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {birthdate ? format(birthdate, "yyyy년 MM월 dd일", { locale: ko }) : "생년월일을 선택하세요"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={birthdate}
                        onSelect={(date) => {
                          if (date) {
                            // 미래 날짜와 1900년 이전 날짜 체크
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            const minDate = new Date(1900, 0, 1)
                            
                            if (date > today) {
                              toast.error("미래 날짜는 선택할 수 없습니다")
                              return
                            }
                            if (date < minDate) {
                              toast.error("1900년 이후의 날짜만 선택할 수 있습니다")
                              return
                            }
                            
                            setBirthdate(date)
                            setFormData({ ...formData, birthdate: format(date, 'yyyy-MM-dd') })
                          }
                          setIsDatePickerOpen(false)
                        }}
                        locale={ko}
                        startMonth={new Date(1900, 0)}
                        endMonth={new Date()}
                        defaultMonth={birthdate || new Date()}
                        captionLayout="dropdown"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldLabel htmlFor="gender">성별</FieldLabel>
                <FieldContent>
                  <Select
                    value={formData.gender || "none"}
                    onValueChange={(value: "male" | "female" | "none") =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="성별을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택 안 함</SelectItem>
                      <SelectItem value="male">남성</SelectItem>
                      <SelectItem value="female">여성</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field orientation="vertical">
                <FieldLabel>주소</FieldLabel>
                <FieldContent>
                  <div className="flex gap-2">
                    <Input
                      id="zip_code"
                      type="text"
                      placeholder="우편번호"
                      value={formData.zip_code || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, zip_code: e.target.value })
                      }
                      className="flex-1"
                      maxLength={5}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddressSearchOpen(true)}
                    >
                      검색
                    </Button>
                  </div>
                  <Input
                    id="address1"
                    type="text"
                    placeholder="도로명 주소"
                    value={formData.address1 || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address1: e.target.value })
                    }
                    className="mt-1"
                  />
                  <Input
                    id="address2"
                    type="text"
                    placeholder="상세주소"
                    value={formData.address2 || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address2: e.target.value })
                    }
                    className="mt-1"
                  />
              </FieldContent>
            </Field>
            </div>
          </FieldGroup>
        </FieldSet>
      </div>

      {/* 하단 고정 저장 버튼 섹션 */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[var(--sidebar-width)] border-t bg-background px-6 py-4 z-50 md:peer-data-[state=collapsed]:left-[var(--sidebar-width-icon)]">
        <div className="flex justify-start gap-3">
          <Button
            variant="outline"
            onClick={() => {
                const birthdateDate = profile.birthdate ? new Date(profile.birthdate) : undefined
                setBirthdate(birthdateDate)
                setFormData({
                  nickname: profile.nickname || "",
                  full_name: profile.full_name || "",
                  bio: profile.bio || "",
                  phone: profile.phone || "",
                  birthdate: profile.birthdate || "",
                  gender: profile.gender || null,
                  address1: profile.address1 || "",
                  address2: profile.address2 || "",
                  zip_code: profile.zip_code || "",
                })
                // 프로필 이미지 초기화
                if (profile.avatar_url) {
                  setProfileImagePreview(profile.avatar_url)
                } else {
                  setProfileImagePreview(null)
                }
                setProfileImage(null)
                setImageError(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""
                }
                // 닉네임 유효성 검사 상태 초기화
                setNicknameAvailable(null)
                setNicknameError(null)
                toast.info("변경사항이 취소되었습니다")
            }}
            disabled={saving}
          >
            취소
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>

      {/* 주소 검색 다이얼로그 */}
      <Dialog open={isAddressSearchOpen} onOpenChange={setIsAddressSearchOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>주소 검색</DialogTitle>
            <DialogDescription>
              도로명 또는 건물명을 입력하여 주소를 검색하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="도로명 또는 건물명을 입력하세요"
              value={addressSearchKeyword}
              onChange={(e) => setAddressSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  searchAddress()
                }
              }}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={searchAddress}
              disabled={isSearching || !addressSearchKeyword.trim()}
            >
              {isSearching ? "검색 중..." : "검색"}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {addressSearchResults.length > 0 ? (
              <div className="space-y-2">
                {addressSearchResults.map((address, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-md cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => selectAddress(address)}
                  >
                    <div className="font-medium text-sm">
                      {address.roadAddr || address.jibunAddr}
                    </div>
                    {address.roadAddr && address.jibunAddr && (
                      <div className="text-xs text-muted-foreground mt-1">
                        지번: {address.jibunAddr}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      우편번호: {address.zipNo}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {isSearching ? "검색 중..." : "검색어를 입력하고 검색 버튼을 클릭하세요."}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

