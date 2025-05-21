//
// **NOTE: This test file is created based on the subtask requirements.**
// **However, a testing framework (e.g., Jest) is not currently configured**
// **in this project. To run this test, a testing framework needs to be**
// **set up first (e.g., install Jest, ts-jest, @types/jest, and configure them).**
//

import { convertWordToPdf } from './file-converter';
import mammoth from 'mammoth';
import htmlToPdf from 'html-pdf-node';
import { Buffer } from 'buffer';

// Mock the external libraries
jest.mock('mammoth');
jest.mock('html-pdf-node');

describe('convertWordToPdf', () => {
  const mockWordBuffer = Buffer.from('dummy-word-content');
  const mockHtmlOutput = { value: '<h1>Test</h1><p>Hello world</p>', messages: [] };
  const mockPdfBuffer = Buffer.from('fake-pdf-content');

  beforeEach(() => {
    // Reset mocks before each test
    (mammoth.convertToHtml as jest.Mock).mockReset();
    (htmlToPdf.generatePdf as jest.Mock).mockReset();
  });

  it('should successfully convert a Word buffer to a PDF buffer', async () => {
    // Setup mock implementations
    (mammoth.convertToHtml as jest.Mock).mockResolvedValue(mockHtmlOutput);
    (htmlToPdf.generatePdf as jest.Mock).mockResolvedValue(mockPdfBuffer);

    const result = await convertWordToPdf(mockWordBuffer);

    // Assertions
    expect(mammoth.convertToHtml).toHaveBeenCalledWith({ buffer: mockWordBuffer });
    expect(htmlToPdf.generatePdf).toHaveBeenCalledWith(
      { content: mockHtmlOutput.value },
      { format: 'A4' }
    );
    expect(result).toBe(mockPdfBuffer);
  });

  it('should throw an error if mammoth.convertToHtml fails', async () => {
    const errorMessage = 'Mammoth conversion failed';
    (mammoth.convertToHtml as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(convertWordToPdf(mockWordBuffer)).rejects.toThrow(errorMessage);

    expect(mammoth.convertToHtml).toHaveBeenCalledWith({ buffer: mockWordBuffer });
    expect(htmlToPdf.generatePdf).not.toHaveBeenCalled();
  });

  it('should throw an error if htmlToPdf.generatePdf fails', async () => {
    const errorMessage = 'HTML to PDF conversion failed';
    (mammoth.convertToHtml as jest.Mock).mockResolvedValue(mockHtmlOutput);
    (htmlToPdf.generatePdf as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(convertWordToPdf(mockWordBuffer)).rejects.toThrow(errorMessage);

    expect(mammoth.convertToHtml).toHaveBeenCalledWith({ buffer: mockWordBuffer });
    expect(htmlToPdf.generatePdf).toHaveBeenCalledWith(
      { content: mockHtmlOutput.value },
      { format: 'A4' }
    );
  });

  it('should return null if htmlToPdf.generatePdf returns a nullish value (e.g. empty buffer)', async () => {
    // Simulate html-pdf-node returning a null or undefined buffer, though the current implementation of convertWordToPdf
    // expects it to throw or return a Buffer. This test case reflects the original subtask description's note
    // on handling null return from the conversion, even if the current live code might not produce this scenario.
    (mammoth.convertToHtml as jest.Mock).mockResolvedValue(mockHtmlOutput);
    (htmlToPdf.generatePdf as jest.Mock).mockResolvedValue(null as any); // Simulate null return

    const result = await convertWordToPdf(mockWordBuffer);
    
    // Based on the current implementation of convertWordToPdf, if generatePdf returns null,
    // it will log an error and return null.
    expect(result).toBeNull();
    expect(mammoth.convertToHtml).toHaveBeenCalledWith({ buffer: mockWordBuffer });
    expect(htmlToPdf.generatePdf).toHaveBeenCalledWith(
        { content: mockHtmlOutput.value },
        { format: 'A4' }
    );
  });
});
