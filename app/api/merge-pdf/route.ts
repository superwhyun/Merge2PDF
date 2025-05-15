import { type NextRequest, NextResponse } from "next/server"
import { PDFDocument } from "pdf-lib"
import { v4 as uuidv4 } from "uuid"
import pdfStore from "@/lib/pdf-store"

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: "파일이 업로드되지 않았습니다." }, { status: 400 })
    }

    console.log(`Received ${files.length} files for merging`)

    // 유효한 PDF 파일만 필터링
    const pdfFiles = []
    for (const file of files) {
      if (file.type === "application/pdf") {
        pdfFiles.push(file)
        console.log(`Valid PDF file: ${file.name}, size: ${file.size} bytes`)
      } else {
        console.log(`Skipping non-PDF file: ${file.name}, type: ${file.type}`)
      }
    }

    if (pdfFiles.length === 0) {
      return NextResponse.json({ error: "처리할 PDF 파일이 없습니다." }, { status: 400 })
    }

    // PDF 병합
    try {
      // pdf-lib를 사용하여 PDF 병합
      const mergedPdf = await PDFDocument.create()

      console.log(`Starting PDF merge process with ${pdfFiles.length} files`)

      for (const file of pdfFiles) {
        try {
          console.log(`Processing file: ${file.name}`)
          const fileBuffer = await file.arrayBuffer()
          console.log(`File ${file.name} loaded into buffer, size: ${fileBuffer.byteLength} bytes`)

          const pdf = await PDFDocument.load(new Uint8Array(fileBuffer))
          console.log(`File ${file.name} loaded as PDF, pages: ${pdf.getPageCount()}`)

          const pageIndices = pdf.getPageIndices()
          console.log(`File ${file.name} has ${pageIndices.length} pages`)

          const copiedPages = await mergedPdf.copyPages(pdf, pageIndices)
          console.log(`Copied ${copiedPages.length} pages from ${file.name}`)

          copiedPages.forEach((page) => mergedPdf.addPage(page))
          console.log(`Added all pages from ${file.name} to merged document`)
        } catch (error) {
          console.error(`Error processing PDF file ${file.name}: ${error}`)
          // 오류가 발생해도 계속 진행
        }
      }

      console.log(`All files processed, saving merged PDF`)

      // 병합된 PDF를 바이트 배열로 저장
      const mergedPdfBytes = await mergedPdf.save()
      console.log(`Merged PDF saved, size: ${mergedPdfBytes.length} bytes`)

      // 고유 ID 생성
      const fileId = uuidv4()
      console.log(`Generated file ID: ${fileId}`)

      // 저장소에 상태 확인
      const beforeIds = pdfStore.getAllPdfIds()
      console.log(`Store before saving - IDs: ${beforeIds.join(', ')}`)

      // 메모리 저장소에 저장 (Base64 인코딩)
      pdfStore.savePDF(fileId, mergedPdfBytes)
      
      // 저장 후 상태 확인
      const afterIds = pdfStore.getAllPdfIds()
      console.log(`Store after saving - IDs: ${afterIds.join(', ')}`)

      return NextResponse.json({
        success: true,
        fileId: fileId,
        pageCount: mergedPdf.getPageCount(),
        fileSize: mergedPdfBytes.length,
      })
    } catch (error) {
      console.error(`Error merging PDFs: ${error}`)
      return NextResponse.json({ 
        error: "PDF 파일을 병합하는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error processing files:", error)
    return NextResponse.json(
      { 
        error: "파일 처리 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 },
    )
  }
}
