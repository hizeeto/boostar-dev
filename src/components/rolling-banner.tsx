"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BannerItem {
  id: string
  title: string
  subtitle: string
  imageUrl?: string
  backgroundColor?: string
  link?: string
}

interface RollingBannerProps {
  items: BannerItem[]
  autoPlayInterval?: number // 자동 재생 간격 (ms)
  className?: string
}

export function RollingBanner({ 
  items, 
  autoPlayInterval = 5000,
  className 
}: RollingBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }, [items.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }, [items.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    // 3초 후 자동 재생 재개
    setTimeout(() => setIsAutoPlaying(true), 3000)
  }

  // 자동 재생
  useEffect(() => {
    if (!isAutoPlaying || items.length <= 1) return

    const interval = setInterval(goToNext, autoPlayInterval)
    return () => clearInterval(interval)
  }, [isAutoPlaying, autoPlayInterval, goToNext, items.length])

  if (items.length === 0) return null

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl", className)}>
      <div className="relative h-[450px]">
        {/* 배너 아이템들 */}
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className="relative min-w-full h-full flex-shrink-0"
              style={{ backgroundColor: item.backgroundColor || "#f3f4f6" }}
            >
              {item.imageUrl ? (
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.imageUrl})` }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center px-8">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm md:text-base text-white/90">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              )}
              {/* 그라데이션 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              {/* 텍스트 콘텐츠 */}
              <div className="absolute bottom-0 left-0 right-0 px-6 pt-6 pb-12 md:p-8">
                <h3 className="text-lg md:text-2xl font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm md:text-base text-white/90">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 좌우 네비게이션 버튼 */}
        {items.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg z-10"
              onClick={goToPrev}
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              <ChevronLeft className="h-5 w-5 text-gray-800" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg z-10"
              onClick={goToNext}
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              <ChevronRight className="h-5 w-5 text-gray-800" />
            </Button>
          </>
        )}

        {/* 인디케이터 */}
        {items.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {items.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "w-8 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/75"
                )}
                onClick={() => goToSlide(index)}
                aria-label={`배너 ${index + 1}로 이동`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

