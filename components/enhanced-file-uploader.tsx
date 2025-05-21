"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Loader2, Upload, AlertCircle, Info, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import SimpleFileList from "./simple-file-list"

/**
 * 파일 업로더 컴포넌트
 * 
 * 이 컴포넌트는 PDF 파일을 업로드하고, 순서를 조정하며, 병합 및 다운로드하는 
 * 전체 워크플로우를 관리합니다.
 */
export default function EnhancedFileUploader() {
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [mergedFileId, setMergedFileId] = useState<string | null>(null)
  const [mergedFileInfo, setMergedFileInfo] = useState<{ pageCount: number; fileSize: number } | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  
  // 파일 드롭 처리
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for only PDF files
    const validFiles = acceptedFiles.filter((file) => {
      const isValid =
        file.type === "application/pdf" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type === "application/msword"

      if (!isValid) {
        toast({
          title: "파일 형식 오류",
          description: `${file.name}은(는) 지원되지 않는 파일 형식입니다. 현재는 PDF(.pdf) 및 Word(.doc, .docx) 파일만 지원합니다.`,
          variant: "destructive",
        })
      }

      return isValid
    })

    setFiles((prev) => [...prev, ...validFiles])
  }, [])

  // 드랍존 설정
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
    },
    noClick: false,
    noKeyboard: false,
    maxSize: 100 * 1024 * 1024, // 100MB 제한
    multiple: true,
  })
  
  // 파일 제거
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }
  
  // 파일 순서 변경 처리
  const handleReorder = (reorderedFiles: File[]) => {
    setFiles(reorderedFiles)
  }

  // PDF 병합 처리
  const handleMerge = async () => {
    if (files.length === 0) {
      toast({
        title: "파일 없음",
        description: "병합할 파일을 먼저 업로드해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(10) // Start with 10% to show activity
    setMergedFileId(null)
    setMergedFileInfo(null)
    setDownloadError(null)

    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append("files", file)
      })

      // Set up progress updates
      const updateProgress = () => {
        setUploadProgress((prev) => {
          // Increment progress but cap at 90% until complete
          const newProgress = prev + 5
          return newProgress > 90 ? 90 : newProgress
        })
      }

      // Update progress every 500ms to simulate activity
      const progressInterval = setInterval(updateProgress, 500)

      const response = await fetch("/api/merge-pdf", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      let data
      try {
        data = await response.json()
      } catch (error) {
        console.error("Failed to parse response as JSON:", error)
        const text = await response.text()
        console.error("Response text:", text)
        throw new Error("서버 응답을 처리하는 중 오류가 발생했습니다.")
      }

      if (!response.ok) {
        throw new Error(data.error || "PDF 병합 중 오류가 발생했습니다.")
      }

      setMergedFileId(data.fileId)
      setMergedFileInfo({
        pageCount: data.pageCount || 0,
        fileSize: data.fileSize || 0,
      })
      setUploadProgress(100)

      toast({
        title: "PDF 병합 완료",
        description: "모든 파일이 성공적으로 병합되었습니다.",
      })
    } catch (error) {
      console.error("Error merging PDFs:", error)
      setUploadProgress(0)
      toast({
        title: "오류 발생",
        description: error instanceof Error ? error.message : "PDF 병합 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  // 병합된 PDF 다운로드 처리
  const handleDownload = async () => {
    if (!mergedFileId) return

    setIsDownloading(true)
    setDownloadError(null)

    try {
      console.log(`Attempting to download PDF with ID: ${mergedFileId}`)
      
      // API에서 Base64 인코딩된 PDF 데이터 가져오기 (최대 3번 재시도)
      let response;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        console.log(`Download attempt ${retryCount + 1} for file ${mergedFileId}`)
        response = await fetch(`/api/download-pdf/${mergedFileId}`);
        
        if (response.ok) break;
        
        // 서버 응답이 404가 아니면 즉시 실패
        if (response.status !== 404) {
          const errorText = await response.text();
          throw new Error(errorText || `PDF 다운로드 중 오류 발생 (HTTP ${response.status})`);
        }
        
        // 404 오류일 경우 재시도 전 잠시 대기
        retryCount++;
        console.log(`File not found, retrying in ${retryCount * 500}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryCount * 500));
      }
      
      if (!response || !response.ok) {
        const errorText = await response?.text() || "응답 없음";
        throw new Error(errorText || `PDF 다운로드 중 오류 발생 (${response?.status || 'unknown'})`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || "PDF 데이터를 가져오는 중 오류가 발생했습니다.");
      }
      
      console.log(`Successfully downloaded PDF data, size: ${data.data.length}`);

      // Base64 디코딩 및 Blob 생성
      const binaryString = window.atob(data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.contentType || "application/pdf" });

      // Blob URL 생성 및 다운로드
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = data.filename || "merged.pdf";
      document.body.appendChild(link);
      link.click();

      // 정리
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
      }, 100)

      toast({
        title: "다운로드 완료",
        description: "PDF 파일이 성공적으로 다운로드되었습니다.",
      })
    } catch (error) {
      console.error("Download error:", error)
      setDownloadError("PDF 다운로드 중 오류가 발생했습니다. 다시 시도해주세요.")

      toast({
        title: "다운로드 오류",
        description: error instanceof Error ? error.message : "PDF 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary/50",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="h-10 w-10 text-gray-400" />
          <h3 className="text-lg font-semibold">파일을 여기에 드래그하세요</h3>
          <p className="text-sm text-gray-500">또는 클릭하여 파일을 선택하세요</p>
          <p className="text-xs text-gray-400 mt-2">현재 지원 형식: PDF (.pdf)</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">업로드된 파일 ({files.length})</h3>
          
          {/* 간단한 드래그 가능한 파일 목록 컴포넌트 */}
          <SimpleFileList 
            files={files} 
            onReorder={handleReorder}
            onRemove={removeFile}
            formatFileSize={formatFileSize}
          />

          <div className="flex flex-col gap-4">
            <Button 
              onClick={handleMerge} 
              disabled={isUploading || files.length === 0} 
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                "파일 병합하기"
              )}
            </Button>

            {isUploading && <Progress value={uploadProgress} className="h-2 w-full" />}

            {downloadError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{downloadError}</AlertDescription>
              </Alert>
            )}

            {mergedFileInfo && (
              <Alert className="mt-2 bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-700">
                  병합된 PDF: {mergedFileInfo.pageCount}페이지, {formatFileSize(mergedFileInfo.fileSize)}
                </AlertDescription>
              </Alert>
            )}

            {mergedFileId && (
              <Button variant="outline" className="w-full" onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    다운로드 중...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    병합된 PDF 다운로드
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}