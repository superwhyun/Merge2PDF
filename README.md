# Merge2PDF

PDF 및 Word 파일을 간편하게 하나의 PDF로 병합하는 웹 애플리케이션입니다.  
https://v0.dev, desktop commander mcp, claude를 이용하였으며,  
바이브 코딩만으로 개발하였습니다.  
~~심지어 한 시간도 걸리지 않았어요.~~  
~~개발자들 망했어요.~~

## 데모

https://merge2-pdf.vercel.app/

## 주요 기능

- **드래그 앤 드롭 업로드**: 여러 PDF 및 Word(.doc, .docx) 파일을 쉽게 업로드
- **파일 미리보기**: 업로드된 PDF 파일을 미리볼 수 있는 기능
- **파일 순서 변경**: 드래그 앤 드롭으로 병합될 파일들의 순서 조정
- **PDF 병합**: 선택된 PDF 및 Word 파일들을 하나의 PDF로 병합
- **병합된 PDF 다운로드**: 병합된 PDF 파일을 다운로드

## 지원 파일 형식

- PDF (.pdf)
- Word (.doc, .docx)

## 기술 스택

- **프론트엔드**: Next.js, React, TypeScript, Tailwind CSS
- **PDF/Word 처리**: pdf-lib, mammoth, html-pdf-node
- **UI/UX**: 드래그 앤 드롭 인터페이스, 반응형 디자인

## 설치 및 실행

### 요구사항

- Node.js 18.x 이상
- npm

### 설치

```bash
# 패키지 설치 (peer dependency 문제 방지)
npm install --legacy-peer-deps
```

### 개발 서버 실행

```bash
npm run dev
```

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 프로덕션 서버 실행
npm run start
```

## 사용 방법

1. 브라우저에서 애플리케이션 접속
2. PDF 또는 Word 파일을 드래그 앤 드롭하거나 클릭하여 업로드
3. 필요한 경우 미리보기 버튼을 클릭하여 파일 내용 확인
4. 드래그 앤 드롭으로 파일 순서 변경 (필요시)
5. '파일 병합하기' 버튼 클릭
6. '병합된 PDF 다운로드' 버튼으로 결과 파일 다운로드

## 라이센스

MIT

## 기여하기

이슈와 풀 리퀘스트는 언제나 환영합니다. 대규모 변경사항의 경우, 먼저 이슈를 생성하여 논의해주세요.
