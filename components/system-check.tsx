"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SystemCheck() {
  const [tools, setTools] = useState<{ libreoffice: boolean; pdftk: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkTools = async () => {
      try {
        const response = await fetch("/api/check-tools")
        if (!response.ok) {
          throw new Error("도구 확인 중 오류가 발생했습니다.")
        }
        const data = await response.json()
        setTools(data.tools)
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.")
      } finally {
        setLoading(false)
      }
    }

    checkTools()
  }, [])

  if (loading) return null

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>오류</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!tools) return null

  const allToolsInstalled = tools.libreoffice && tools.pdftk

  if (allToolsInstalled) return null

  return (
    <Alert variant={allToolsInstalled ? "default" : "destructive"} className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>시스템 요구사항</AlertTitle>
      <AlertDescription>
        <p className="mb-2">일부 필수 도구가 서버에 설치되어 있지 않습니다:</p>
        <ul className="list-disc pl-5 space-y-1">
          {!tools.libreoffice && (
            <li>LibreOffice가 설치되어 있지 않습니다. Word 파일을 PDF로 변환하는 데 필요합니다.</li>
          )}
          {!tools.pdftk && (
            <li>pdftk가 설치되어 있지 않습니다. PDF 파일을 병합하는 데 사용됩니다. (대체 방법이 사용됩니다)</li>
          )}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
