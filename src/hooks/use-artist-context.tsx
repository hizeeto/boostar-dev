"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Artist, useArtists } from "./use-artists"

interface ArtistContextType {
  artists: Artist[]
  loading: boolean
  error: Error | null
  activeArtist: Artist | null
  setActiveArtist: (artist: Artist | null) => void
  refetch: () => Promise<void>
  createArtist: (artistData: {
    name: string
    description?: string
    icon_url?: string
    color?: string
  }) => Promise<Artist>
  updateArtist: (artistId: string, updates: Partial<Artist>) => Promise<void>
  deleteArtist: (artistId: string) => Promise<void>
}

const ArtistContext = createContext<ArtistContextType | undefined>(undefined)

const ACTIVE_ARTIST_STORAGE_KEY = "active_artist_id"

export function ArtistProvider({ children }: { children: ReactNode }) {
  const { artists, loading, error, refetch: loadArtists, createArtist, updateArtist, deleteArtist } = useArtists()
  const [activeArtist, setActiveArtistState] = useState<Artist | null>(null)

  // 아티스트 로드 후 기본 아티스트 설정
  useEffect(() => {
    if (!loading && artists.length > 0) {
      // localStorage에서 저장된 아티스트 ID 확인
      const savedArtistId = typeof window !== 'undefined' 
        ? localStorage.getItem(ACTIVE_ARTIST_STORAGE_KEY) 
        : null
      
      let artistToSet: Artist | null = null
      
      if (savedArtistId) {
        // 저장된 아티스트가 여전히 존재하는지 확인
        artistToSet = artists.find(a => a.id === savedArtistId) || null
      }
      
      // 저장된 아티스트가 없거나 존재하지 않으면 기본 아티스트 사용
      if (!artistToSet) {
        artistToSet = artists.find(a => a.is_default) || artists[0] || null
      }
      
      setActiveArtistState(artistToSet)
      
      // localStorage에 저장
      if (artistToSet && typeof window !== 'undefined') {
        localStorage.setItem(ACTIVE_ARTIST_STORAGE_KEY, artistToSet.id)
      }
    } else if (!loading && artists.length === 0) {
      setActiveArtistState(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ACTIVE_ARTIST_STORAGE_KEY)
      }
    }
  }, [artists, loading])

  const setActiveArtist = (artist: Artist | null) => {
    setActiveArtistState(artist)
    if (artist && typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_ARTIST_STORAGE_KEY, artist.id)
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_ARTIST_STORAGE_KEY)
    }
  }

  const handleCreateArtist = async (artistData: {
    name: string
    description?: string
    icon_url?: string
    color?: string
  }) => {
    const newArtist = await createArtist(artistData)
    // 새로 생성된 아티스트를 활성 아티스트로 설정
    if (newArtist) {
      setActiveArtist(newArtist)
    }
    return newArtist
  }

  return (
    <ArtistContext.Provider
      value={{
        artists,
        loading,
        error,
        activeArtist,
        setActiveArtist,
        refetch: loadArtists,
        createArtist: handleCreateArtist,
        updateArtist,
        deleteArtist,
      }}
    >
      {children}
    </ArtistContext.Provider>
  )
}

export function useArtistContext() {
  const context = useContext(ArtistContext)
  if (context === undefined) {
    throw new Error("useArtistContext must be used within an ArtistProvider")
  }
  return context
}

