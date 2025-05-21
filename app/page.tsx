import EnhancedFileUploader from "@/components/enhanced-file-uploader"
import Image from "next/image"

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-start p-6 md:p-10 flex-1">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Image 
              src="/icon.svg" 
              alt="Merge2PDF logo" 
              width={44} 
              height={44} 
              className="rounded-lg"
            />
            <h1 className="text-3xl font-bold">Merge2PDF</h1>
          </div>
          <p className="text-center mb-8 text-gray-600">
            드래그 & 드랍으로 PDF 또는 Word 파일을 업로드하면 하나의 PDF로 합쳐드립니다.
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            <strong>알림:</strong> PDF(.pdf)와 Word(.doc, .docx) 파일을 모두 지원합니다.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h3 className="text-blue-800 font-medium mb-2">사용 방법</h3>
          <ol className="list-decimal pl-5 text-blue-800 text-sm space-y-1">
            <li>PDF 또는 Word 파일을 드래그하거나 클릭하여 업로드합니다.</li>
            <li>필요한 경우 파일을 미리보기하고 순서를 변경합니다.</li>
            <li>"파일 병합하기" 버튼을 클릭하여 모든 파일을 하나의 PDF로 병합합니다.</li>
            <li>"병합된 PDF 다운로드" 버튼을 클릭하여 결과 파일을 다운로드합니다.</li>
          </ol>
        </div>
        <EnhancedFileUploader />
      </div>
    </main>
  )
}
