"use client"

import React, { useState, useRef } from "react"
import { FileText, X, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import SimplePdfViewer from "./simple-pdf-viewer"

interface SimpleFileListProps {
  files: File[]
  onReorder: (files: File[]) => void
  onRemove: (index: number) => void
  formatFileSize: (bytes: number) => string
}

/**
 * 간단한 파일 목록 컴포넌트
 * 
 * 사용자가 드래그 앤 드롭으로 파일 순서를 변경할 수 있게 합니다.
 * react-beautiful-dnd 대신 네이티브 HTML5 드래그 앤 드롭 API를 사용합니다.
 */
const SimpleFileList: React.FC<SimpleFileListProps> = ({ 
  files, 
  onReorder, 
  onRemove, 
  formatFileSize 
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const draggedOverIndex = useRef<number | null>(null);

  // 드래그 시작 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedIndex(index);
  };

  // 드래그 오버 핸들러
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    draggedOverIndex.current = index;
  };

  // 드롭 핸들러
  const handleDrop = () => {
    if (draggedIndex === null || draggedOverIndex.current === null) return;
    
    const newFiles = [...files];
    const draggedFile = newFiles[draggedIndex];
    
    // 재정렬
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(draggedOverIndex.current, 0, draggedFile);
    
    // 상위 컴포넌트에 전달
    onReorder(newFiles);
    
    // 상태 초기화
    setDraggedIndex(null);
    draggedOverIndex.current = null;
  };
  
  return (
    <ul className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
      {files.map((file, index) => (
        <li
          key={index}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
          className={`flex items-center justify-between p-2 rounded transition-colors
            ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}
            ${draggedIndex !== null && draggedOverIndex.current === index ? 'border-2 border-blue-400' : 'bg-gray-50 hover:bg-blue-50'}`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div 
              className="cursor-grab p-1 rounded hover:bg-gray-200 active:cursor-grabbing"
              title="드래그하여 순서 변경"
            >
              <GripVertical className="h-4 w-4 text-gray-500" />
            </div>
            <span className="text-xs font-medium bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">
              {index + 1}
            </span>
            <FileText className="h-5 w-5 text-red-500" />
            <span className="truncate text-sm">{file.name}</span>
            <span className="text-xs text-gray-500 whitespace-nowrap">({formatFileSize(file.size)})</span>
          </div>
          <div className="flex items-center">
            {/* PDF 미리보기 컴포넌트 */}
            <SimplePdfViewer file={file} />
            
            <Button variant="ghost" size="icon" onClick={() => onRemove(index)} className="h-8 w-8 ml-1">
              <X className="h-4 w-4" />
              <span className="sr-only">Remove file</span>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default SimpleFileList;