import { type NextRequest, NextResponse } from "next/server"
import { PDFDocument, degrees } from "pdf-lib"
import { convertImageToPdf } from "@/lib/file-converter"
import { Buffer } from "buffer"

const MAX_FILES = 50
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024
const MAX_TOTAL_SIZE_BYTES = 250 * 1024 * 1024

type SupportedFileType = "application/pdf" | "image/jpeg" | "image/png"

interface FileFailure {
  name: string
  reason: string
}

const getSupportedFileType = (file: File): SupportedFileType | null => {
  const mimeType = file.type.toLowerCase()

  if (mimeType === "application/pdf") return "application/pdf"
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "image/jpeg"
  if (mimeType === "image/png") return "image/png"

  const extension = file.name.split(".").pop()?.toLowerCase()

  if (extension === "pdf") return "application/pdf"
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg"
  if (extension === "png") return "image/png"

  return null
}

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files").filter((value): value is File => value instanceof File)

    if (files.length === 0) {
      return NextResponse.json({ error: "파일이 업로드되지 않았습니다." }, { status: 400 })
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `최대 ${MAX_FILES}개 파일까지 병합할 수 있습니다.` }, { status: 413 })
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0)

    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      return NextResponse.json({ error: "업로드한 파일의 총 크기가 너무 큽니다. 250MB 이하로 줄여주세요." }, { status: 413 })
    }

    console.log(`Received ${files.length} files for processing`)

    const loadedPdfDocs: Array<{ name: string; pdfDoc: PDFDocument }> = []
    const failures: FileFailure[] = []

    for (const file of files) {
      console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`)

      if (file.size === 0) {
        failures.push({ name: file.name, reason: "빈 파일입니다." })
        continue
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        failures.push({ name: file.name, reason: "파일 크기가 100MB를 초과합니다." })
        continue
      }

      const fileType = getSupportedFileType(file)

      if (!fileType) {
        failures.push({ name: file.name, reason: "지원하지 않는 파일 형식입니다." })
        continue
      }

      const fileBuffer = await file.arrayBuffer()

      if (fileType === "application/pdf") {
        try {
          console.log(`Loading PDF: ${file.name}`)
          const pdfDoc = await PDFDocument.load(new Uint8Array(fileBuffer), { ignoreEncryption: true })
          loadedPdfDocs.push({ name: file.name, pdfDoc })
          console.log(`Successfully loaded PDF: ${file.name}, pages: ${pdfDoc.getPageCount()}`)
        } catch (error) {
          const reason = getErrorMessage(error)
          console.error(`Error loading PDF file ${file.name}: ${reason}`)
          failures.push({ name: file.name, reason: "PDF 파일을 열 수 없습니다. 암호화되었거나 손상된 파일일 수 있습니다." })
        }
      } else if (fileType === "image/jpeg" || fileType === "image/png") {
        console.log(`Converting image file to PDF: ${file.name}`)
        try {
          const pdfBuffer = await convertImageToPdf(Buffer.from(fileBuffer), fileType)

          if (pdfBuffer) {
            const pdfDoc = await PDFDocument.load(pdfBuffer)
            loadedPdfDocs.push({ name: file.name, pdfDoc })
            console.log(`Successfully converted and loaded image file: ${file.name}, pages: ${pdfDoc.getPageCount()}`)
          } else {
            failures.push({ name: file.name, reason: "이미지를 PDF로 변환하지 못했습니다." })
          }
        } catch (error) {
          const reason = getErrorMessage(error)
          console.error(`Error processing image file ${file.name}: ${reason}`)
          failures.push({ name: file.name, reason: "이미지를 PDF로 변환하지 못했습니다." })
        }
      }
    }

    if (loadedPdfDocs.length === 0) {
      return NextResponse.json({ error: "처리할 PDF 또는 이미지 파일이 없습니다.", failures }, { status: 400 })
    }

    if (failures.length > 0) {
      return NextResponse.json(
        {
          error: "일부 파일을 처리하지 못해 병합을 중단했습니다.",
          failures,
        },
        { status: 422 },
      )
    }

    try {
      const mergedPdf = await PDFDocument.create()
      console.log(`Starting PDF merge process with ${loadedPdfDocs.length} documents`)

      for (const { name, pdfDoc } of loadedPdfDocs) {
        try {
          const pageIndices = pdfDoc.getPageIndices()
          console.log(`${name} has ${pageIndices.length} pages`)

          const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices)
          console.log(`Copied ${copiedPages.length} pages from ${name}`)

          copiedPages.forEach((page) => {
            // "Invalid rotation" 에러 방지를 위해 회전 값을 정규화
            const rotation = page.getRotation();
            // rotation이 객체이고 angle 속성이 있으면 그것을 사용, 아니면 rotation 자체(숫자일 경우) 또는 0 사용
            const angle = typeof rotation === 'object' && rotation !== null && 'angle' in rotation
              ? rotation.angle
              : (typeof rotation === 'number' ? rotation : 0);

            page.setRotation(degrees(angle));
            mergedPdf.addPage(page);
          })
          console.log(`Added all pages from a document to merged document`)
        } catch (error) {
          const reason = getErrorMessage(error)
          console.error(`Error processing ${name} for merging: ${reason}`)
          return NextResponse.json(
            {
              error: "PDF 파일을 병합하는 중 오류가 발생했습니다.",
              failures: [{ name, reason: "이 파일의 페이지를 병합하지 못했습니다." }],
            },
            { status: 422 },
          )
        }
      }

      if (mergedPdf.getPageCount() === 0) {
        return NextResponse.json({ error: "병합할 페이지가 없습니다." }, { status: 500 })
      }

      console.log(`All documents processed, saving merged PDF`)

      const mergedPdfBytes = await mergedPdf.save()
      console.log(`Merged PDF saved, size: ${mergedPdfBytes.length} bytes`)

      return new NextResponse(Buffer.from(mergedPdfBytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="merged.pdf"',
          "Content-Length": String(mergedPdfBytes.length),
          "X-Page-Count": String(mergedPdf.getPageCount()),
          "Cache-Control": "no-store",
        },
      })
    } catch (error) {
      console.error(`Error merging PDFs: ${error}`)
      return NextResponse.json({ error: "PDF 파일을 병합하는 중 오류가 발생했습니다." }, { status: 500 })
    }
  } catch (error) {
    console.error("Error processing files:", error)
    return NextResponse.json(
      { error: "파일 처리 중 오류가 발생했습니다." },
      { status: 500 },
    )
  }
}
