import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

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
        {children}
        <Toaster />
      </body>
    </html>
  )
}

