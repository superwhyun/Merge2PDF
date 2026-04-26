declare module 'react-beautiful-dnd';

interface Window {
  pdfjsLib?: {
    getDocument: (options: { data: Uint8Array }) => {
      promise: Promise<{ numPages: number }>
    }
  }
}
