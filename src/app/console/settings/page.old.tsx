"use client"

import { useSearchParams } from "next/navigation"
import { ProfileTab } from "@/components/profile-tab"

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "profile"

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {activeTab === "profile" && <ProfileTab />}
      {activeTab !== "profile" && (
        <div className="p-6">
          <p className="text-muted-foreground">계정 설정 페이지입니다.</p>
          <p className="text-sm text-muted-foreground mt-2">현재 선택된 탭: {activeTab}</p>
        </div>
      )}
    </div>
  )
}

