# Manual Testing Guide: PDF and Word File Merging

This guide provides steps for manually testing the PDF and Word file merging functionality of the application.

## 1. Prerequisites

*   Ensure the application is running locally or on a deployed environment.
*   Have access to the web page containing the file uploader for merging documents.

## 2. Prepare Test Files

Create or obtain a set of test files to cover various scenarios. It's recommended to have:

*   **`simple.docx`**: A basic `.docx` file with a few paragraphs of text.
*   **`formatted.docx`**: A `.docx` file with more complex formatting, such as:
    *   Headings (H1, H2)
    *   Bold and italic text
    *   Bulleted or numbered lists
    *   (Optional, if supported by `mammoth` and `html-pdf-node` conversion): A small, simple image embedded in the document.
*   **`simple.doc`**: A basic `.doc` file (Word 97-2003 format). Test this to confirm if `mammoth` handles it gracefully. If not, focus on `.docx`.
*   **`standard.pdf`**: A regular, valid PDF file.
*   **`multi-page.pdf`**: A PDF file with multiple pages.
*   **`corrupted.docx` (Optional)**: A `.docx` file that is intentionally corrupted or not a valid Word document (e.g., a `.txt` file renamed to `.docx`). This is to test error handling.
*   **`other_file.txt` (Optional)**: A plain text file.
*   **`image.jpg` (Optional)**: An image file.

These optional files help test the system's robustness in skipping unsupported or problematic files.

## 3. Test Scenarios

For each scenario, upload the specified files using the application's file uploader and initiate the merge process.

1.  **PDF Only Merge:**
    *   Files: `standard.pdf`, `multi-page.pdf`
    *   Expected: A single PDF is generated containing the pages from both `standard.pdf` and `multi-page.pdf`, in the order they were uploaded.

2.  **Word (.docx) Only Merge & Conversion:**
    *   Files: `simple.docx`
    *   Expected: A single PDF is generated. The content of this PDF should match the content of `simple.docx`.
    *   Verify: Basic text and paragraph structure.

3.  **Formatted Word (.docx) Merge & Conversion:**
    *   Files: `formatted.docx`
    *   Expected: A single PDF is generated. The content should match `formatted.docx`.
    *   Verify: Check how well headings, bold/italic text, and lists are preserved. Note any significant layout deviations (perfect fidelity is not expected, but core content and basic structure should be there). If an image was included, check if it appears.

4.  **Word (.doc) Merge & Conversion (If applicable):**
    *   Files: `simple.doc`
    *   Expected: A single PDF is generated, similar to the `.docx` test.
    *   Verify: If `mammoth` struggles with `.doc`, this might fail or produce poor results. Note the outcome.

5.  **Mixed PDF and Word (.docx) Merge:**
    *   Files: `standard.pdf`, `simple.docx`, `multi-page.pdf`, `formatted.docx` (upload in a specific order)
    *   Expected: A single PDF is generated containing content from all uploaded files, converted to PDF where necessary, and appended in the specified order.
    *   Verify: Check content from both PDF and Word source files.

6.  **Corrupted/Invalid Word File Handling:**
    *   Files: `corrupted.docx`, `standard.pdf`, `simple.docx`
    *   Expected: The `corrupted.docx` should be skipped (ideally with a console log indicating an error for that file). The `standard.pdf` and `simple.docx` should be merged successfully.
    *   Verify: The resulting PDF contains only the content from `standard.pdf` and `simple.docx`.

7.  **Unsupported File Type Handling:**
    *   Files: `other_file.txt`, `image.jpg`, `standard.pdf`
    *   Expected: `other_file.txt` and `image.jpg` should be skipped (console logs should indicate this). `standard.pdf` should be processed.
    *   Verify: The resulting PDF contains only the content from `standard.pdf`.

8.  **No Valid Files Uploaded:**
    *   Files: `other_file.txt`, `image.jpg`
    *   Expected: An error message should be displayed to the user indicating that no processable files were found (e.g., "처리할 PDF 또는 변환 가능한 Word 파일이 없습니다.").

9.  **Empty Upload:**
    *   Files: (Upload no files)
    *   Expected: An error message like "파일이 업로드되지 않았습니다." should be displayed.

## 4. Verification Steps for Each Test

*   **Initiate Merge:** Click the merge button.
*   **Observe Behavior:**
    *   Note any success or error messages displayed in the UI.
    *   Check the browser's developer console for log messages (e.g., file processing steps, errors, skipped files).
*   **Download Result:** If the merge is reported as successful, download the resulting PDF.
*   **Inspect PDF:**
    *   Open the downloaded PDF.
    *   **Content Correctness:** Verify that the content from the source files is present.
    *   **Order:** Ensure the content appears in the order the files were uploaded/processed.
    *   **Page Count:** Check if the page count matches expectations.
    *   **Basic Layout Integrity (for Word conversions):**
        *   Are headings, paragraphs, and lists generally preserved?
        *   Is text readable?
        *   (Understand that complex layouts or fonts might not translate perfectly from Word to PDF via HTML conversion.)
*   **Record Results:** Note down the outcome of each test scenario.

## 5. Reporting Issues

If any test scenario does not produce the expected outcome:
*   Document the scenario and the files used.
*   Describe the actual result vs. the expected result.
*   Include any error messages from the UI or console.
*   Save the source files and the incorrect output PDF if possible.

This structured approach will help ensure the reliability of the file merging feature.
