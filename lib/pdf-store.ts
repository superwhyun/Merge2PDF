// 향상된 인메모리 PDF 저장소 (Next.js 개발 환경에서의 핫 리로딩 고려)
interface StoredPDF {
  data: string // Base64 encoded string
  createdAt: Date
}

// 타입 안전성을 위한 전역 저장소 타입 정의
declare global {
  // eslint-disable-next-line no-var
  var __PDF_STORE__: Map<string, StoredPDF> | undefined
}

// 개발 환경에서 핫 리로딩 문제를 해결하기 위해 global 객체 사용
const getGlobalStore = (): Map<string, StoredPDF> => {
  if (!global.__PDF_STORE__) {
    global.__PDF_STORE__ = new Map<string, StoredPDF>();
  }
  return global.__PDF_STORE__;
};

class PDFStore {
  private static instance: PDFStore
  private get store(): Map<string, StoredPDF> {
    return getGlobalStore();
  }

  private constructor() {
    // 주기적으로 오래된 PDF 파일 정리 (1시간마다)
    setInterval(() => this.cleanup(), 60 * 60 * 1000)
    console.log('PDF Store initialized with persistent storage')
  }

  public static getInstance(): PDFStore {
    if (!PDFStore.instance) {
      PDFStore.instance = new PDFStore()
    }
    return PDFStore.instance
  }

  // PDF 저장 (Base64 인코딩)
  public savePDF(id: string, data: Uint8Array): void {
    // Convert binary data to Base64 string
    const base64Data = Buffer.from(data).toString("base64")
    
    this.store.set(id, {
      data: base64Data,
      createdAt: new Date(),
    })
    
    console.log(`PDF stored with ID: ${id}, size: ${data.length} bytes, store size: ${this.store.size}`)
  }

  // PDF 가져오기 (Base64 인코딩된 문자열)
  public getPDF(id: string): string | null {
    console.log(`Getting PDF with ID: ${id}, available IDs: ${Array.from(this.store.keys()).join(', ')}`)
    const pdf = this.store.get(id)
    if (!pdf) {
      console.error(`PDF with ID ${id} not found in store`)
      return null
    }
    console.log(`Found PDF with ID: ${id}, created at: ${pdf.createdAt}`)
    return pdf.data
  }

  // 오래된 PDF 정리 (24시간 이상 지난 파일)
  private cleanup(): void {
    const now = new Date()
    for (const [id, pdf] of this.store.entries()) {
      const ageInHours = (now.getTime() - pdf.createdAt.getTime()) / (1000 * 60 * 60)
      if (ageInHours > 24) {
        this.store.delete(id)
        console.log(`Cleaned up PDF with ID: ${id}, age: ${ageInHours.toFixed(2)} hours`)
      }
    }
  }
  
  // 저장된 모든 PDF ID 목록 반환 (디버깅용)
  public getAllPdfIds(): string[] {
    return Array.from(this.store.keys())
  }
}

export default PDFStore.getInstance()
