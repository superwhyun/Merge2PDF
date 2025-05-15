import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execPromise = promisify(exec)

export async function GET() {
  const tools = {
    libreoffice: false,
    pdftk: false,
  }

  try {
    await execPromise("libreoffice --version")
    tools.libreoffice = true
  } catch (error) {
    console.error("LibreOffice is not installed:", error)
  }

  try {
    await execPromise("pdftk --version")
    tools.pdftk = true
  } catch (error) {
    console.error("pdftk is not installed:", error)
  }

  return NextResponse.json({
    tools,
    message: "이 정보는 서버에 필요한 도구가 설치되어 있는지 확인합니다.",
  })
}
