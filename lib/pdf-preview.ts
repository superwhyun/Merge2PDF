/**
 * PDF 미리보기를 위한 유틸리티 함수
 * 이 모듈은 PDF 파일을 데이터 URL로 변환하는 기능을 제공합니다.
 */

// PDF 파일을 데이터 URL로 변환하는 함수
export async function convertFileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}