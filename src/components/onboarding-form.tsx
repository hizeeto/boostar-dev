"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSuccess,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getDemoUser, DEMO_USER_ID } from "@/lib/demo-session"
import { toast } from "sonner"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { generateProjectCode } from "@/lib/utils"

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/heic']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_AVATAR_URL = '/assets/BI_symbol.svg' // 기본 프로필 이미지

export function OnboardingForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 프로필 이미지
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  
  // 닉네임
  const [nickname, setNickname] = useState("")
  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const [checkingNickname, setCheckingNickname] = useState(false)
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null)
  const nicknameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 이름
  const [fullName, setFullName] = useState("")
  const [fullNameError, setFullNameError] = useState<string | null>(null)
  
  // 생년월일
  const [birthdate, setBirthdate] = useState<Date | undefined>(undefined)
  const [birthdateInput, setBirthdateInput] = useState("")
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [birthdateError, setBirthdateError] = useState<string | null>(null)

  // 성별
  const [gender, setGender] = useState<"male" | "female" | "">("")
  const [genderError, setGenderError] = useState<string | null>(null)
  
  // 휴대전화번호
  const [phone, setPhone] = useState("")
  
  // 주소
  const [zipcode, setZipcode] = useState("") // 우편번호
  const [address1, setAddress1] = useState("") // 주소1
  const [address2, setAddress2] = useState("") // 주소2
  const [address1Error, setAddress1Error] = useState<string | null>(null)
  
  // 주소 검색
  const [isAddressSearchOpen, setIsAddressSearchOpen] = useState(false)
  const [addressSearchKeyword, setAddressSearchKeyword] = useState("")
  const [addressSearchResults, setAddressSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

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

    setCheckingNickname(true)
    setNicknameError(null)
    setNicknameAvailable(null)

    try {
      console.log('닉네임 확인 시작:', nicknameToCheck.trim())
      const { data, error } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("nickname", nicknameToCheck.trim())
        .maybeSingle()

      // maybeSingle()은 데이터가 없으면 null을 반환하고 에러를 발생시키지 않음
      if (error) {
        console.error('닉네임 확인 쿼리 오류:', error)
        console.error('오류 상세:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        // 컬럼이 없는 경우 (PGRST116 또는 42703) - 닉네임 사용 가능으로 처리
        if (error.code === 'PGRST116' || error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
          console.warn('nickname 컬럼이 없거나 테이블이 없는 경우, 닉네임 사용 가능으로 처리합니다.')
          setNicknameAvailable(true)
          setNicknameError(null)
          return
        }
        
        throw error
      }

      if (data) {
        // 닉네임이 이미 사용 중
        console.log('닉네임 중복:', data)
        setNicknameAvailable(false)
        setNicknameError("해당 닉네임은 사용할 수 없습니다.")
      } else {
        // 닉네임 사용 가능
        console.log('닉네임 사용 가능')
        setNicknameAvailable(true)
        setNicknameError(null)
      }
    } catch (err: any) {
      console.error('닉네임 확인 중 예외 발생:', err)
      // 에러가 발생해도 닉네임 사용 가능으로 처리 (DB 문제일 수 있음)
      console.warn('닉네임 확인 실패, 사용 가능으로 처리합니다.')
      setNicknameAvailable(true)
      setNicknameError(null)
    } finally {
      setCheckingNickname(false)
    }
  }, [supabase])

  // 닉네임 입력 시 자동 중복 검사 (debounce)
  useEffect(() => {
    // 이전 timeout 취소
    if (nicknameCheckTimeoutRef.current) {
      clearTimeout(nicknameCheckTimeoutRef.current)
    }

    // 입력이 없거나 유효하지 않으면 상태 초기화
    if (!nickname.trim() || nickname.length < 2 || nickname.length > 20) {
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
  }, [nickname, checkNicknameAvailability])

  // 폼 유효성 검사
  const isNicknameValid = nickname.trim().length >= 2 && 
                          nickname.trim().length <= 20 && 
                          nicknameAvailable === true && 
                          !checkingNickname
  const isFullNameValid = fullName.trim().length > 0
  const isBirthdateValid = birthdate !== undefined && 
                           birthdate <= new Date() && 
                           birthdate.getFullYear() >= 1900
  const isGenderValid = gender === "male" || gender === "female"
  const isAddressValid = address1.trim().length > 0
  
  const isFormValid = isNicknameValid && 
                      isFullNameValid && 
                      isBirthdateValid && 
                      isGenderValid && 
                      isAddressValid

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
        console.log('주소 검색 결과:', results)
        if (results.length > 0) {
          console.log('첫 번째 결과 예시:', results[0])
        }
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
    console.log('주소 선택:', address)
    
    // 도로명주소 API 응답 필드명 확인
    const zipNo = address.zipNo || ""
    const roadAddr = address.roadAddr || ""
    const jibunAddr = address.jibunAddr || ""
    
    console.log('추출된 값:', { zipNo, roadAddr, jibunAddr })
    
    // 우편번호 설정
    if (zipNo) {
      setZipcode(zipNo)
    }
    
    // 주소1 설정 (도로명 주소 우선, 없으면 지번 주소)
    if (roadAddr) {
      setAddress1(roadAddr)
    } else if (jibunAddr) {
      setAddress1(jibunAddr)
    }
    
    // 주소2 초기화
    setAddress2("")
    
    // 다이얼로그 닫기
    setIsAddressSearchOpen(false)
    setAddressSearchKeyword("")
    setAddressSearchResults([])
    
    console.log('주소 설정 완료:', { zipcode: zipNo, address1: roadAddr || jibunAddr })
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNicknameError(null)
    setFullNameError(null)
    setBirthdateError(null)
    setGenderError(null)
    setAddress1Error(null)

    console.log('온보딩 폼 제출 시작')
    console.log('현재 상태:', {
      nickname,
      nicknameAvailable,
      checkingNickname,
      fullName,
      birthdate,
      gender,
      zipcode,
      address1,
      address2,
      phone
    })

    // 유효성 검사
    if (!nickname.trim()) {
      console.log('검증 실패: 닉네임 없음')
      setNicknameError("닉네임을 입력해주세요.")
      return
    }

    if (nickname.length < 2 || nickname.length > 20) {
      console.log('검증 실패: 닉네임 길이')
      setNicknameError("닉네임은 2자 이상 20자 이하여야 합니다.")
      return
    }

    if (checkingNickname) {
      console.log('검증 실패: 닉네임 확인 중')
      setNicknameError("닉네임 확인이 진행 중입니다. 잠시만 기다려주세요.")
      return
    }

    if (nicknameAvailable !== true) {
      console.log('검증 실패: 닉네임 사용 불가', { nicknameAvailable })
      setNicknameError("사용 가능한 닉네임을 입력해주세요.")
      return
    }

    if (!fullName.trim()) {
      console.log('검증 실패: 이름 없음')
      setFullNameError("이름을 입력해주세요.")
      return
    }

    // 생년월일 유효성 검사
    if (!birthdate) {
      console.log('검증 실패: 생년월일 미입력')
      setBirthdateError("생년월일을 선택해주세요.")
      return
    }

    // 미래 날짜 체크
    if (birthdate > new Date()) {
      console.log('검증 실패: 미래 날짜')
      setBirthdateError("미래 날짜는 입력할 수 없습니다.")
      return
    }

    // 너무 오래된 날짜 체크 (1900년 이전)
    if (birthdate.getFullYear() < 1900) {
      console.log('검증 실패: 너무 오래된 날짜')
      setBirthdateError("올바른 생년월일을 입력해주세요.")
      return
    }

    if (!gender) {
      console.log('검증 실패: 성별 미선택')
      setGenderError("성별을 선택해주세요.")
      return
    }

    if (!address1.trim()) {
      console.log('검증 실패: 주소1 없음')
      setAddress1Error("주소를 입력해주세요.")
      return
    }

    console.log('모든 검증 통과, 제출 시작')

    setLoading(true)

    try {
      console.log('사용자 정보 확인 중...')
      
      // 데모 사용자 확인
      const demoUser = getDemoUser()
      let userId: string
      
      if (demoUser) {
        userId = DEMO_USER_ID
        console.log('[OnboardingForm] 데모 사용자 모드:', userId)
      } else {
        // 현재 사용자 정보 가져오기
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('사용자 정보 가져오기 오류:', userError)
          throw new Error(`로그인 오류: ${userError.message}`)
        }
        
        if (!user) {
          console.error('사용자 정보 없음')
          throw new Error("로그인이 필요합니다.")
        }
        
        userId = user.id
      }

      console.log('사용자 ID:', userId)

      let avatarUrl: string | null = null

      // 프로필 이미지 업로드
      if (profileImage) {
        console.log('프로필 이미지 업로드 시작...')
        try {
          const fileExt = profileImage.name.split('.').pop()
          const fileName = `${userId}-${Date.now()}.${fileExt}`
          const filePath = `profile-images/${fileName}`

          // avatars 버킷에 업로드
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

          // 공개 URL 가져오기
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath)

          avatarUrl = urlData.publicUrl
          console.log('이미지 업로드 성공:', avatarUrl)
        } catch (imgError: any) {
          console.error('이미지 업로드 중 오류:', imgError)
          // 이미지 업로드 실패 시 기본 이미지 사용
          console.log('기본 이미지로 대체합니다.')
          avatarUrl = DEFAULT_AVATAR_URL
        }
      } else {
        // 이미지를 업로드하지 않은 경우 기본 이미지 사용
        console.log('프로필 이미지가 없어 기본 이미지를 사용합니다.')
        avatarUrl = DEFAULT_AVATAR_URL
      }

      // 프로필 정보 업데이트 (레코드가 없으면 생성)
      const cleanedPhone = phone.trim() ? phone.replace(/-/g, "") : null
      
      // 생년월일을 YYYY-MM-DD 형식으로 변환
      const birthdateString = birthdate ? format(birthdate, 'yyyy-MM-dd') : null
      
      // 데모 사용자인 경우 이메일 가져오기
      const userEmail = demoUser ? demoUser.email : (await supabase.auth.getUser()).data.user?.email || null
      
      const profileData = {
        id: userId,
        nickname: nickname.trim(),
        full_name: fullName.trim(),
        birthdate: birthdateString,
        gender: gender,
        phone: cleanedPhone || null,
        zip_code: zipcode.trim() || null,
        address1: address1.trim(),
        address2: address2.trim() || null,
        avatar_url: avatarUrl,
        email: userEmail,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      }

      console.log('프로필 데이터 저장 시작:', { ...profileData, avatar_url: avatarUrl ? '설정됨' : '없음' })

      // 프로필 저장 (재시도 로직 포함)
      let upsertData = null
      let updateError = null
      const maxRetries = 3
      const retryDelay = 2000 // 2초

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`프로필 저장 시도 ${attempt}/${maxRetries}...`)
        
        const result = await supabase
          .from("profiles")
          .upsert(profileData, {
            onConflict: 'id'
          })
          .select()

        updateError = result.error
        upsertData = result.data

        if (!updateError) {
          console.log('프로필 저장 성공:', upsertData)
          break
        }

        console.error(`시도 ${attempt} 실패:`, updateError)
        
        // 스키마 캐시 오류인 경우에만 재시도
        const isSchemaCacheError = updateError.message?.includes('schema cache') || 
                                   updateError.message?.includes('Could not find')
        
        if (isSchemaCacheError && attempt < maxRetries) {
          console.log(`${retryDelay / 1000}초 후 재시도...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue
        }

        // 마지막 시도이거나 스키마 캐시 오류가 아닌 경우 중단
        break
      }

      if (updateError) {
        console.error('프로필 저장 최종 오류:', updateError)
        console.error('오류 상세:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        })
        
        // 더 명확한 에러 메시지
        let errorMessage = `프로필 저장 실패: ${updateError.message || '알 수 없는 오류'}`
        
        if (updateError.message?.includes('schema cache') || updateError.message?.includes('Could not find')) {
          errorMessage = `데이터베이스 스키마 캐시 오류가 발생했습니다. 다음 방법을 시도해주세요:\n\n` +
                        `1. Supabase Dashboard → Settings → API → "Restart API" 클릭\n` +
                        `2. 또는 Supabase 프로젝트를 재시작\n` +
                        `3. 몇 분 후 다시 시도\n\n` +
                        `(오류: ${updateError.message})`
        } else if (updateError.code === 'PGRST301' || updateError.message?.includes('permission')) {
          errorMessage = `데이터베이스 권한 오류입니다. RLS(Row Level Security) 정책을 확인해주세요.`
        }
        
        throw new Error(errorMessage)
      }

      console.log('프로필 저장 성공:', upsertData)

      // 기본 아티스트 생성 (아직 아티스트가 없는 경우)
      console.log('기본 아티스트 생성 확인 중...')
      try {
        // 사용자의 기존 아티스트 확인
        const { data: existingArtists, error: artistsCheckError } = await supabase
          .from('artists')
          .select('id')
          .eq('user_id', userId)
          .limit(1)

        if (artistsCheckError) {
          console.error('아티스트 확인 오류:', artistsCheckError)
          // 아티스트 확인 실패해도 계속 진행 (나중에 수동 생성 가능)
        } else if (!existingArtists || existingArtists.length === 0) {
          // 아티스트가 없으면 기본 아티스트 생성
          console.log('기본 아티스트 생성 시작...')
          
          // 고유번호 생성 및 중복 확인
          let artistCode: string
          let attempts = 0
          const maxAttempts = 10
          
          do {
            artistCode = generateProjectCode()
            const { data: existing } = await supabase
              .from('artists')
              .select('id')
              .eq('artist_code', artistCode)
              .maybeSingle()
            
            if (!existing) {
              break // 고유번호가 중복되지 않음
            }
            
            attempts++
            if (attempts >= maxAttempts) {
              throw new Error("고유번호 생성에 실패했습니다.")
            }
          } while (true)

          // 기본 아티스트 생성
          const { data: newArtist, error: artistError } = await supabase
            .from('artists')
            .insert({
              user_id: userId,
              names: { ko: '기본 아티스트' },
              description: null,
              icon_url: null,
              color: null,
              artist_code: artistCode,
              is_default: true,
              sort_order: 0,
            })
            .select()
            .single()

          if (artistError) {
            console.error('기본 아티스트 생성 오류:', artistError)
            // 아티스트 생성 실패해도 계속 진행 (나중에 수동 생성 가능)
            toast.warning('프로필은 저장되었지만 기본 아티스트 생성에 실패했습니다. 나중에 수동으로 생성해주세요.')
          } else {
            console.log('기본 아티스트 생성 성공:', newArtist)
          }
        } else {
          console.log('이미 아티스트가 존재합니다. 기본 아티스트 생성을 건너뜁니다.')
        }
      } catch (artistErr: any) {
        console.error('기본 아티스트 생성 중 예외 발생:', artistErr)
        // 예외 발생해도 계속 진행
        toast.warning('프로필은 저장되었지만 기본 아티스트 생성 중 오류가 발생했습니다.')
      }

      // 성공 메시지 표시
      toast.success('프로필이 저장되었습니다!')

      // 온보딩 완료 후 콘솔로 이동
      console.log('콘솔로 이동 중...')
      router.replace("/console")
    } catch (err: any) {
      console.error('온보딩 폼 제출 오류:', err)
      const errorMessage = err.message || err.error?.message || "프로필 저장 중 오류가 발생했습니다."
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} noValidate {...props}>
      <FieldGroup className="grid grid-cols-1 gap-12">
        <div className="flex flex-col items-start gap-1 text-left col-span-full">
          <h1 className="text-2xl font-semibold text-balance">
            Boostar 회원이<br className="md:hidden" /> 되신 걸 환영합니다!
          </h1>
          <p className="text-muted-foreground text-sm text-balance">
            시작에 앞서, 몇 가지 정보를 입력해주세요.<br></br>입력하신 정보는 추후 수정 가능합니다.
          </p>
        </div>

        {/* 2단 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 col-span-full">
          {/* 왼쪽 컬럼: 프로필 이미지, 닉네임, 이름, 생년월일 */}
          <div className="flex flex-col gap-6">
            {/* 프로필 이미지 */}
            <Field>
              <FieldLabel>
                프로필 이미지{" "}
                <span className="text-xs text-muted-foreground font-normal">(선택)</span>
              </FieldLabel>
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
                    {profileImage ? (
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
                          onClick={() => {
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
                        size="xs"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        추가
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Field>

            {/* 닉네임 */}
            <Field>
              <FieldLabel htmlFor="nickname">닉네임</FieldLabel>
              <Input
                id="nickname"
                type="text"
                placeholder="닉네임을 입력해 주세요."
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value)
                  setNicknameError(null)
                }}
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
            </Field>

            {/* 이름 */}
            <Field>
              <FieldLabel htmlFor="fullName">이름</FieldLabel>
              <Input
                id="fullName"
                type="text"
                placeholder="이름을 입력해 주세요."
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  setFullNameError(null)
                }}
                variant={fullNameError ? "error" : "default"}
              />
              {fullNameError && <FieldError>{fullNameError}</FieldError>}
            </Field>

            {/* 생년월일 */}
            <Field>
              <FieldLabel htmlFor="birthdate">생년월일</FieldLabel>
              <div className="relative flex gap-2">
                <Input
                  id="birthdate"
                  value={birthdateInput}
                  placeholder="생년월일을 선택해 주세요."
                  className={cn("bg-background pr-10", birthdateError && "border-destructive")}
                  onChange={(e) => {
                    const value = e.target.value
                    setBirthdateInput(value)
                    setBirthdateError(null)
                    
                    // YYYY-MM-DD 형식으로 파싱 시도
                    const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
                    if (dateMatch) {
                      const [, year, month, day] = dateMatch
                      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                      if (!isNaN(date.getTime()) && 
                          date.getFullYear() === parseInt(year) &&
                          date.getMonth() === parseInt(month) - 1 &&
                          date.getDate() === parseInt(day)) {
                        setBirthdate(date)
                        setBirthdateInput(format(date, 'yyyy-MM-dd'))
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault()
                      setIsDatePickerOpen(true)
                    }
                  }}
                  variant={birthdateError ? "error" : "default"}
                />
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                    >
                      <CalendarIcon className="size-3.5" />
                      <span className="sr-only">날짜 선택</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="end"
                    alignOffset={-8}
                    sideOffset={10}
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
                            setBirthdateError("미래 날짜는 선택할 수 없습니다.")
                            return
                          }
                          if (date < minDate) {
                            setBirthdateError("1900년 이후의 날짜만 선택할 수 있습니다.")
                            return
                          }
                          
                          setBirthdate(date)
                          setBirthdateInput(format(date, 'yyyy-MM-dd'))
                          setBirthdateError(null)
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
              </div>
              {birthdateError && <FieldError>{birthdateError}</FieldError>}
            </Field>
          </div>

          {/* 오른쪽 컬럼: 성별, 휴대전화번호, 주소 */}
          <div className="flex flex-col gap-6">
            {/* 성별 */}
            <Field>
              <FieldLabel>성별</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={gender === "male" ? "default" : "outline"}
                  className="h-10 font-normal"
                  onClick={() => {
                    setGender("male")
                    setGenderError(null)
                  }}
                >
                  남성
                </Button>
                <Button
                  type="button"
                  variant={gender === "female" ? "default" : "outline"}
                  className="h-10 font-normal"
                  onClick={() => {
                    setGender("female")
                    setGenderError(null)
                  }}
                >
                  여성
                </Button>
              </div>
              {genderError && <FieldError>{genderError}</FieldError>}
            </Field>

            {/* 휴대전화번호 */}
            <Field>
              <FieldLabel htmlFor="phone">휴대전화번호</FieldLabel>
              <Input
                id="phone"
                type="tel"
                placeholder="휴대전화번호를 입력해 주세요."
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9-]/g, "")
                  setPhone(value)
                }}
              />
            </Field>

            {/* 주소 */}
            <Field>
              <FieldLabel>주소</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="zipcode"
                  type="text"
                  placeholder="우편번호"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  className="flex-1"
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
                value={address1}
                onChange={(e) => {
                  setAddress1(e.target.value)
                  setAddress1Error(null)
                }}
                variant={address1Error ? "error" : "default"}
              />
              {address1Error && <FieldError>{address1Error}</FieldError>}
              <Input
                id="address2"
                type="text"
                placeholder="상세주소"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
              />
            </Field>
          </div>
        </div>

        {error && (
          <FieldError className="col-span-full">{error}</FieldError>
        )}

        <Field className="col-span-full">
          <Button 
            type="submit" 
            disabled={!isFormValid || loading || checkingNickname} 
            className="w-full"
            onClick={(e) => {
              console.log('완료 버튼 클릭됨')
              console.log('버튼 상태:', { loading, checkingNickname, isFormValid })
            }}
          >
            {loading ? "저장 중..." : checkingNickname ? "닉네임 확인 중..." : "완료"}
          </Button>
        </Field>
      </FieldGroup>

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
    </form>
  )
}
