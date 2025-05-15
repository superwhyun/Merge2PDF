import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Footer } from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Merge2PDF - PDF 병합 도구",
  description: "여러 PDF 파일을 하나로 병합하는 무료 온라인 도구입니다.",
  generator: 'v0.dev',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* 기본 브라우저의 PDF 뷰어 사용 */}
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  )
}
