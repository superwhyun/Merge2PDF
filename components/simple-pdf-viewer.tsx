"use client"

import { useEffect, useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog-custom"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { convertFileToDataURL } from "@/lib/pdf-preview"

interface PdfViewerProps {
  file: File
}

/**
 * 간단한 PDF 뷰어 컴포넌트
 * 
 * 이 컴포넌트는 PDF 파일을 미리보기 할 수 있는 기능을 제공합니다.
 * 기본 브라우저 PDF 뷰어를 사용하여 안정적인 미리보기를 제공합니다.
 */
export default function SimplePdfViewer({ file }: PdfViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // PDF 파일이 변경될 때 데이터 URL로 변환
  useEffect(() => {
    // 다이얼로그가 닫혀있으면 PDF 로드 스킵
    if (!isOpen) return;
    
    // 이미 로드된 경우 스킵
    if (pdfDataUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    // PDF 파일을 Data URL로 변환
    const loadPdf = async () => {
      try {
        const dataUrl = await convertFileToDataURL(file);
        setPdfDataUrl(dataUrl);
      } catch (err) {
        console.error('PDF 로드 중 오류:', err);
        setError('PDF를 로드할 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPdf();
    
    // 다이얼로그가 닫힐 때 메모리 정리
    return () => {
      // Data URL 초기화는 하지 않음 (캐싱 효과)
    };
  }, [file, isOpen, pdfDataUrl]);
  
  // 다이얼로그가 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      // 다이얼로그가 닫힐 때만 Data URL 초기화
      setPdfDataUrl(null);
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0" 
          title="PDF 미리보기"
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">PDF 미리보기</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-2 pt-6 sm:pt-8 overflow-hidden">
        <DialogHeader className="absolute top-1 left-0 right-8 px-4 h-6 mb-0 pb-0 z-10">
          <DialogTitle className="text-xs text-gray-600 truncate">{file.name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full pt-6 sm:pt-6">
          {isLoading && (
            <div className="flex-1 flex items-center justify-center bg-gray-100 rounded">
              <span className="text-gray-500">PDF를 로딩 중입니다...</span>
            </div>
          )}
          
          {error && (
            <div className="flex-1 flex items-center justify-center bg-red-50 rounded">
              <span className="text-red-500">{error}</span>
            </div>
          )}
          
          {!isLoading && !error && pdfDataUrl && (
            <div className="flex-1 w-full h-full">
              <iframe 
                src={pdfDataUrl}
                className="w-full h-full border-0 rounded"
                title={`${file.name} 미리보기`}
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}