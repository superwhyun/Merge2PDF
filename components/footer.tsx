"use client"

import Link from "next/link"
import { Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t mt-auto py-6 bg-gray-50">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()} Merge2PDF</span>
          <span className="text-gray-300">|</span>
          <Link 
            href="https://github.com/superwhyun/Merge2PDF" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-black transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </Link>
        </div>
        <p className="text-xs text-center max-w-md">
          간편하게 PDF 파일들을 병합할 수 있는 오픈소스 도구입니다.
          문제점이나 개선사항은 GitHub에 이슈로 등록해주세요.
        </p>
      </div>
    </footer>
  )
}