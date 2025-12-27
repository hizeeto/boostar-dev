"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isSearching, setIsSearching] = React.useState(false)

  // 다이얼로그가 닫힐 때 검색어 초기화
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("")
    }
  }, [open])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // TODO: 실제 검색 로직 구현
      console.log("검색어:", searchQuery)
      // 검색 API 호출 등
    } catch (error) {
      console.error("검색 중 오류:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>검색</DialogTitle>
          <DialogDescription>
            프로젝트, 멤버, 콘텐츠 등을 검색하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="검색어를 입력하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? "검색 중..." : "검색"}
            </Button>
          </div>
          <div className="min-h-[200px] border rounded-md p-4">
            {searchQuery ? (
              <div className="text-center text-muted-foreground py-8">
                검색 결과가 여기에 표시됩니다.
                <br />
                <span className="text-sm">검색어: {searchQuery}</span>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                검색어를 입력하세요.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

