import { PDFDocument } from "pdf-lib"

const A4_WIDTH = 595
const A4_HEIGHT = 842

type SupportedFileType = "application/pdf" | "image/jpeg" | "image/png"

interface MergeOptions {
  onProgress?: (progress: number) => void
}

interface MergeResult {
  blob: Blob
  pageCount: number
  fileSize: number
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

export const isSupportedMergeFile = (file: File) => getSupportedFileType(file) !== null

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

const addImagePage = async (mergedPdf: PDFDocument, file: File, fileType: "image/jpeg" | "image/png") => {
  const imageBytes = new Uint8Array(await file.arrayBuffer())
  const image = fileType === "image/png" ? await mergedPdf.embedPng(imageBytes) : await mergedPdf.embedJpg(imageBytes)
  const page = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT])

  const imageRatio = image.width / image.height
  const pageRatio = A4_WIDTH / A4_HEIGHT
  const drawWidth = imageRatio > pageRatio ? A4_WIDTH : A4_HEIGHT * imageRatio
  const drawHeight = imageRatio > pageRatio ? A4_WIDTH / imageRatio : A4_HEIGHT

  page.drawImage(image, {
    x: (A4_WIDTH - drawWidth) / 2,
    y: (A4_HEIGHT - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  })
}

export async function mergeFilesInBrowser(files: File[], options: MergeOptions = {}): Promise<MergeResult> {
  const mergedPdf = await PDFDocument.create()
  const failures: string[] = []

  for (const [index, file] of files.entries()) {
    const fileType = getSupportedFileType(file)

    if (!fileType) {
      failures.push(`${file.name}: 지원하지 않는 파일 형식`)
      continue
    }

    if (file.size === 0) {
      failures.push(`${file.name}: 빈 파일`)
      continue
    }

    try {
      if (fileType === "application/pdf") {
        const sourcePdf = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), { ignoreEncryption: true })
        const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices())
        copiedPages.forEach((page) => mergedPdf.addPage(page))
      } else {
        await addImagePage(mergedPdf, file, fileType)
      }
    } catch (error) {
      console.error(`Failed to merge ${file.name}: ${getErrorMessage(error)}`)
      failures.push(`${file.name}: 파일을 처리할 수 없음`)
    }

    options.onProgress?.(Math.min(90, Math.round(((index + 1) / files.length) * 90)))
  }

  if (failures.length > 0) {
    throw new Error(`일부 파일을 처리하지 못해 병합을 중단했습니다. 실패 파일: ${failures.join(", ")}`)
  }

  const pageCount = mergedPdf.getPageCount()

  if (pageCount === 0) {
    throw new Error("병합할 페이지가 없습니다.")
  }

  const mergedPdfBytes = await mergedPdf.save()
  const blob = new Blob([mergedPdfBytes], { type: "application/pdf" })

  return {
    blob,
    pageCount,
    fileSize: blob.size,
  }
}
