import { type NextRequest, NextResponse } from "next/server"
import pdfStore from "@/lib/pdf-store"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    console.log(`Download request for PDF with ID: ${id}`)
    
    // 디버깅용: 현재 저장소에 있는 모든 PDF ID 출력
    const allIds = pdfStore.getAllPdfIds()
    console.log(`Available PDF IDs in store: ${allIds.join(', ')}`)

    // 파일 ID 검증
    if (!id || !id.match(/^[a-zA-Z0-9-]+$/)) {
      console.error(`Invalid file ID: ${id}`)
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 })
    }

    // 메모리 저장소에서 PDF 가져오기 (Base64 인코딩된 문자열)
    const pdfBase64 = pdfStore.getPDF(id)

    // PDF가 존재하는지 확인
    if (!pdfBase64) {
      console.error(`PDF with ID ${id} not found in store`)
      return NextResponse.json({ 
        error: "File not found or expired",
        availableIds: allIds 
      }, { status: 404 })
    }

    console.log(`Found PDF with ID ${id}, returning Base64 data of length ${pdfBase64.length}`)

    // Base64 인코딩된 PDF 데이터를 JSON으로 반환
    return NextResponse.json({
      success: true,
      filename: "merged.pdf",
      data: pdfBase64,
      contentType: "application/pdf",
    })
  } catch (error) {
    console.error("Error downloading PDF:", error)
    return NextResponse.json({ 
      error: "Error downloading file", 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
