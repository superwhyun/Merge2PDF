"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { convertFileToDataURL } from "@/lib/pdf-preview"

interface PdfViewerProps {
  file: File
}

/**
 * PDF 뷰어 컴포넌트
 * 
 * 이 컴포넌트는 업로드된 PDF 파일을 미리보기 할 수 있는 기능을 제공합니다.
 * 사용자는 모달 다이얼로그 내에서 PDF를 볼 수 있으며, 페이지 이동 버튼을 통해
 * 여러 페이지를 탐색할 수 있습니다.
 */
export default function PdfViewer({ file }: PdfViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const pdfRef = useRef<HTMLIFrameElement>(null)
  
  // PDF 파일이 변경될 때 데이터 URL로 변환
  useEffect(() => {
    // 다이얼로그가 닫혀있으면 PDF 로드 스킵
    if (!isOpen) return;
    
    let isMounted = true;
    
    const loadPdf = async () => {
      try {
        if (file) {
          // 이미 로드된 경우 중복 로드 방지
          if (pdfDataUrl) return;
          
          console.log(`PDF ${file.name} 로드 시작`);
          const dataUrl = await convertFileToDataURL(file);
          
          // 컴포넌트가 마운트된 상태인 경우에만 상태 업데이트
          if (isMounted) {
            setPdfDataUrl(dataUrl);
            setCurrentPage(1); // 페이지 초기화
          }
          
          // PDF 파일의 총 페이지 수 확인
          try {
            const arrayBuffer = await file.arrayBuffer();
            // 브라우저 환경에서 PDF.js 라이브러리 사용 가능 여부 확인
            if (typeof window !== 'undefined' && window.pdfjsLib) {
              const pdf = await window.pdfjsLib.getDocument({data: new Uint8Array(arrayBuffer)}).promise;
              
              if (isMounted) {
                setTotalPages(pdf.numPages);
                console.log(`PDF ${file.name}의 총 페이지 수: ${pdf.numPages}`);
              }
            } else {
              // PDF.js 라이브러리가 없는 경우 기본값 설정
              if (isMounted) setTotalPages(1);
            }
          } catch (err) {
            console.error("PDF 페이지 수 확인 중 오류:", err);
            if (isMounted) setTotalPages(1);
          }
        }
      } catch (error) {
        console.error("PDF 로드 중 오류 발생:", error);
        if (isMounted) setPdfDataUrl(null);
      }
    };
    
    loadPdf();
    
    // 클린업 함수
    return () => {
      isMounted = false;
    };
  }, [file, isOpen, pdfDataUrl]);
  
  // PDF 미리보기를 위한 iframe URL 생성
  const generatePdfViewerUrl = useCallback((dataUrl: string, page: number) => {
    try {
      // Mozilla PDF.js 뷰어를 사용하는 URL 생성
      const viewerUrl = 'https://mozilla.github.io/pdf.js/web/viewer.html';
      const encodedDataUrl = encodeURIComponent(dataUrl);
      return `${viewerUrl}?file=${encodedDataUrl}#page=${page}`;
    } catch (error) {
      console.error("PDF 뷰어 URL 생성 오류:", error);
      // 오류 시 원본 URL 반환
      return `${dataUrl}#page=${page}`;
    }
  }, []);
  
  // 현재 페이지가 바뀔 때 iframe에 반영
  useEffect(() => {
    if (!pdfDataUrl) return;
    
    try {
      if (pdfRef.current) {
        // PDF.js 뷰어 URL 생성
        const viewerUrl = generatePdfViewerUrl(pdfDataUrl, currentPage);
        
        // iframe 업데이트
        if (pdfRef.current.src !== viewerUrl) {
          console.log(`PDF 페이지 이동: ${currentPage}/${totalPages}`);
          pdfRef.current.src = viewerUrl;
        }
      }
    } catch (error) {
      console.error("PDF 뷰어 업데이트 오류:", error);
    }
  }, [currentPage, pdfDataUrl, totalPages, generatePdfViewerUrl]);
  
  // 페이지 이동 함수
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }
  
  // iframe이 로드될 때 이벤트 처리
  const handleIframeLoad = useCallback(() => {
    console.log(`PDF 뷰어 iframe이 로드됨: 현재 페이지 ${currentPage}`);
  }, [currentPage]);
  
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
      <DialogContent className="max-w-4xl w-full h-[80vh] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{file.name} - 미리보기</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden">
            {pdfDataUrl ? (
              <iframe
                ref={pdfRef}
                src={generatePdfViewerUrl(pdfDataUrl, currentPage)}
                className="w-full h-full border rounded"
                onLoad={handleIframeLoad}
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                PDF를 로딩 중입니다...
              </div>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              페이지 {currentPage} / {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
              >
                다음
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}