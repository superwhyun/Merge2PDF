import { PDFDocument } from 'pdf-lib';
import { Buffer } from 'buffer';

/**
 * Converts an image buffer (jpg/png) to a single-page PDF buffer.
 */
export async function convertImageToPdf(imageBuffer: Buffer, mimeType: string): Promise<Buffer | null> {
  try {
    const pdfDoc = await PDFDocument.create();

    let image;
    if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
      image = await pdfDoc.embedJpg(imageBuffer);
    } else if (mimeType === "image/png") {
      image = await pdfDoc.embedPng(imageBuffer);
    } else {
      console.error("Unsupported image type:", mimeType);
      return null;
    }

    const A4_WIDTH = 595;
    const A4_HEIGHT = 842;
    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

    const imgRatio = image.width / image.height;
    const pageRatio = A4_WIDTH / A4_HEIGHT;

    let drawWidth = A4_WIDTH;
    let drawHeight = A4_HEIGHT;

    if (imgRatio > pageRatio) {
      drawWidth = A4_WIDTH;
      drawHeight = A4_WIDTH / imgRatio;
    } else {
      drawHeight = A4_HEIGHT;
      drawWidth = A4_HEIGHT * imgRatio;
    }

    const x = (A4_WIDTH - drawWidth) / 2;
    const y = (A4_HEIGHT - drawHeight) / 2;

    page.drawImage(image, { x, y, width: drawWidth, height: drawHeight });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Error during image to PDF conversion:', error);
    return null;
  }
}
