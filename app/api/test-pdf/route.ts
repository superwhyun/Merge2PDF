import { NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

export async function GET() {
  try {
    // 간단한 PDF 생성
    const pdfDoc = await PDFDocument.create()
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)

    const page = pdfDoc.addPage([500, 700])
    const { width, height } = page.getSize()

    page.drawText("테스트 PDF 파일입니다.", {
      x: 50,
      y: height - 50,
      size: 30,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    })

    const pdfBytes = await pdfDoc.save()

    // Base64 인코딩
    const base64Data = Buffer.from(pdfBytes).toString("base64")

    // JSON 응답으로 반환
    return NextResponse.json({
      success: true,
      filename: "test.pdf",
      data: base64Data,
      contentType: "application/pdf",
    })
  } catch (error) {
    console.error("Error creating test PDF:", error)
    return NextResponse.json({ error: "테스트 PDF 생성 중 오류가 발생했습니다." }, { status: 500 })
  }
}
