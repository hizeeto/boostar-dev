"use client"

import { useEffect, useState } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useArtistContext } from "@/hooks/use-artist-context"
import { createClient } from "@/lib/supabase/client"

export default function ArtistCodeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const artistContext = useArtistContext()
  const artistCode = params.artistCode as string
  const [mounted, setMounted] = useState(false)

  // 클라이언트에서만 마운트 확인
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // 마운트되지 않았거나 컨텍스트가 로딩 중이면 리턴
    if (!mounted || !artistContext || artistContext.loading || !artistCode) return

    const { artists, activeArtist, setActiveArtist } = artistContext

    // URL의 artistCode로 아티스트 찾기
    const artist = artists.find((a) => a.artist_code === artistCode)

    if (artist && artist.id !== activeArtist?.id) {
      // 아티스트를 찾았고 현재 활성 아티스트와 다르면 설정
      setActiveArtist(artist)
    } else if (!artist && artists.length > 0) {
      // 아티스트를 찾지 못했지만 아티스트가 있으면 기본 아티스트로 리다이렉트
      const defaultArtist = artists.find((a) => a.is_default) || artists[0]
      if (defaultArtist?.artist_code && pathname) {
        const currentPath = pathname.replace(`/${artistCode}`, `/${defaultArtist.artist_code}`)
        router.replace(currentPath)
      }
    }
  }, [mounted, artistCode, artistContext, pathname, router])

  return <>{children}</>
}

