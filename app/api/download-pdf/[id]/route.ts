import { type NextRequest, NextResponse } from "next/server"
import pdfStore from "@/lib/pdf-store"
import { Buffer } from "buffer"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    return new NextResponse(Buffer.from(pdfBase64, "base64"), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="merged.pdf"',
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error downloading PDF:", error)
    return NextResponse.json({ 
      error: "Error downloading file", 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
