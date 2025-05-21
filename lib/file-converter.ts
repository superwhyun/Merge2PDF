import mammoth from 'mammoth';
import htmlToPdf from 'html-pdf-node';
import { Buffer } from 'buffer';

/**
 * Converts a Word document buffer to a PDF buffer.
 *
 * @param wordFileBuffer Buffer containing the Word file data.
 * @returns A Promise that resolves with a Buffer containing the PDF data, or null if conversion fails.
 */
export async function convertWordToPdf(wordFileBuffer: Buffer): Promise<Buffer | null> {
  try {
    console.log('Starting Word to HTML conversion...');
    // Convert Word to HTML
    const htmlResult = await mammoth.convertToHtml({ buffer: wordFileBuffer });
    const htmlString = htmlResult.value;
    console.log('Word to HTML conversion successful.');

    // Log any messages from Mammoth (e.g., warnings)
    if (htmlResult.messages && htmlResult.messages.length > 0) {
      htmlResult.messages.forEach(message => {
        console.log(`Mammoth message: type=${message.type}, message=${message.message}`);
      });
    }

    console.log('Starting HTML to PDF conversion...');
    // Convert HTML to PDF
    // Type assertion for options, as html-pdf-node types might not be perfectly aligned
    const pdfBuffer = await htmlToPdf.generatePdf({ content: htmlString }, { format: 'A4' } as any); 
    
    if (!pdfBuffer) {
      console.error('HTML to PDF conversion resulted in an empty buffer.');
      return null;
    }
    console.log('HTML to PDF conversion successful. PDF Buffer length:', pdfBuffer.length);

    return pdfBuffer;
  } catch (error) {
    console.error('Error during Word to PDF conversion:', error);
    // Re-throwing the error so the caller can decide how to handle it.
    // Alternatively, could return null or a specific error object.
    throw error; 
  }
}
