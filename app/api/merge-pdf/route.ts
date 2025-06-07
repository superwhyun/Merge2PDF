import { type NextRequest, NextResponse } from "next/server"
import { PDFDocument } from "pdf-lib"
import { v4 as uuidv4 } from "uuid"
import pdfStore from "@/lib/pdf-store"
import { convertImageToPdf } from "@/lib/file-converter"
import { Buffer } from "buffer"

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: "파일이 업로드되지 않았습니다." }, { status: 400 })
    }

    console.log(`Received ${files.length} files for processing`)

    const loadedPdfDocs: PDFDocument[] = []

    for (const file of files) {
      console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`)
      if (!file.type) {
        console.warn(`File type is empty for: ${file.name}. File object:`, file);
      }
      // 파일 타입이 비어 있으면 확장자로 추정
      let fileType = file.type;
      if (!fileType && file.name) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === "pdf") fileType = "application/pdf";
        else if (ext === "jpg" || ext === "jpeg") fileType = "image/jpeg";
        else if (ext === "png") fileType = "image/png";
      }
      const fileBuffer = await file.arrayBuffer()

      if (fileType === "application/pdf") {
        try {
          console.log(`Loading PDF: ${file.name}`)
          const pdfDoc = await PDFDocument.load(new Uint8Array(fileBuffer))
          loadedPdfDocs.push(pdfDoc)
          console.log(`Successfully loaded PDF: ${file.name}, pages: ${pdfDoc.getPageCount()}`)
        } catch (error) {
          console.error(`Error loading PDF file ${file.name}: ${error}`)
          // Optionally skip this file or add to an error list
        }
      } else if (fileType === "image/jpeg" || fileType === "image/png") {
        console.log(`Converting image file to PDF: ${file.name}`);
        try {
          const nodeBuffer = Buffer.from(fileBuffer);
          // 동적으로 import (serverless 호환)
          const { convertImageToPdf } = await import('@/lib/file-converter');
          const pdfBuffer = await convertImageToPdf(nodeBuffer, file.type);

          if (pdfBuffer) {
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            loadedPdfDocs.push(pdfDoc);
            console.log(`Successfully converted and loaded image file: ${file.name}, pages: ${pdfDoc.getPageCount()}`);
          } else {
            console.error(`Failed to convert image file ${file.name}: Conversion returned null`);
          }
        } catch (error) {
          if (error instanceof Error) {
            console.error(`Error processing image file ${file.name}: ${error.message}`);
          } else {
            console.error(`Error processing image file ${file.name}: ${String(error)}`);
          }
        }
      } else {
        console.log(`Skipping unsupported file: ${file.name}, type: ${file.type}`)
      }
    }

    if (loadedPdfDocs.length === 0) {
      return NextResponse.json({ error: "처리할 PDF 또는 이미지 파일이 없습니다." }, { status: 400 })
    }

    // PDF 병합
    try {
      const mergedPdf = await PDFDocument.create()
      console.log(`Starting PDF merge process with ${loadedPdfDocs.length} documents`)

      for (const pdfDoc of loadedPdfDocs) {
        try {
          // Assuming pdfDoc is already a PDFDocument instance
          const pageIndices = pdfDoc.getPageIndices()
          console.log(`Document has ${pageIndices.length} pages`)

          const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices)
          console.log(`Copied ${copiedPages.length} pages from a document`)

          copiedPages.forEach((page) => mergedPdf.addPage(page))
          console.log(`Added all pages from a document to merged document`)
        } catch (error) {
          console.error(`Error processing a document for merging: ${error}`)
          // 오류가 발생해도 계속 진행
        }
      }

      if (mergedPdf.getPageCount() === 0) {
        return NextResponse.json({ error: "병합할 페이지가 없습니다. 모든 문서 처리 중 오류가 발생했을 수 있습니다." }, { status: 500 });
      }
      
      console.log(`All documents processed, saving merged PDF`)

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
