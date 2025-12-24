"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useArtistContext } from "@/hooks/use-artist-context"

export default function ConsolePage() {
  const router = useRouter()
  const { artists, loading, activeArtist } = useArtistContext()

  useEffect(() => {
    if (loading) return

    // 활성 아티스트가 있으면 해당 아티스트의 홈으로 리다이렉트
    if (activeArtist?.artist_code) {
      router.replace(`/console/${activeArtist.artist_code}/home`)
      return
    }

    // 활성 아티스트가 없으면 기본 아티스트 찾기
    if (artists.length > 0) {
      const defaultArtist = artists.find((a) => a.is_default) || artists[0]
      if (defaultArtist?.artist_code) {
        router.replace(`/console/${defaultArtist.artist_code}/home`)
        return
      }
    }

    // 아티스트가 없으면 홈으로 (기존 동작 유지)
    router.replace("/console/home")
  }, [loading, activeArtist, artists, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    </div>
  )
}

