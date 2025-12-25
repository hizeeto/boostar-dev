import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { AutoLoginProvider } from "@/components/auto-login-provider"

export const metadata: Metadata = {
  title: "Boostar",
  description: "Boostar 웹서비스",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="overflow-x-hidden">
        <AutoLoginProvider>
          {children}
        </AutoLoginProvider>
        <Toaster />
      </body>
    </html>
  )
}

