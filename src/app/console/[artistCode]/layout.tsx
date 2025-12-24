"use client"

import { useEffect } from "react"
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
  const { artists, loading, activeArtist, setActiveArtist } = useArtistContext()
  const artistCode = params.artistCode as string

  useEffect(() => {
    if (loading || !artistCode) return

    // URL의 artistCode로 아티스트 찾기
    const artist = artists.find((a) => a.artist_code === artistCode)

    if (artist && artist.id !== activeArtist?.id) {
      // 아티스트를 찾았고 현재 활성 아티스트와 다르면 설정
      setActiveArtist(artist)
    } else if (!artist && artists.length > 0) {
      // 아티스트를 찾지 못했지만 아티스트가 있으면 기본 아티스트로 리다이렉트
      const defaultArtist = artists.find((a) => a.is_default) || artists[0]
      if (defaultArtist?.artist_code) {
        const currentPath = pathname.replace(`/${artistCode}`, `/${defaultArtist.artist_code}`)
        router.replace(currentPath)
      }
    }
  }, [artistCode, artists, loading, activeArtist, setActiveArtist, pathname, router])

  return <>{children}</>
}

