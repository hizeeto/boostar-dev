"use client"

import { useSearchParams } from "next/navigation"
import { ArtistProfileTab } from "@/components/artist-profile-tab"
import { ArtistMemberTab } from "@/components/artist-member-tab"
import { ArtistRoleTab } from "@/components/artist-role-tab"
import { ArtistPermissionTab } from "@/components/artist-permission-tab"

export default function ArtistSettingPage() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "profile"

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {activeTab === "profile" && <ArtistProfileTab />}
      {activeTab === "member" && <ArtistMemberTab />}
      {activeTab === "role" && <ArtistRoleTab />}
      {activeTab === "permission" && <ArtistPermissionTab />}
    </div>
  )
}
