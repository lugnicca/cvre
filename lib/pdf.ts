/**
 * PDF parsing utilities using pdfjs-dist
 * Falls back to OCR (tesseract.js) if text extraction fails
 */

// Dynamic import to avoid SSR issues
let pdfjsLib: typeof import('pdfjs-dist') | null = null

async function getPdfJs() {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be used in the browser')
  }
  
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist')
    // Use HTTPS and unpkg as more reliable CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  }
  
  return pdfjsLib
}

export interface ExtractedText {
  text: string;
  pages: string[];
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(file: File): Promise<ExtractedText> {
  const pdfjs = await getPdfJs()
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: Record<string, unknown>) => item.str as string)
      .join(' ');
    pages.push(pageText);
    fullText += pageText + '\n';
  }

  const metadata = await pdf.getMetadata();

  // If extracted text is too short (< 50 chars), might be a scanned PDF
  if (fullText.trim().length < 50) {
    console.warn('PDF text extraction returned minimal text, might need OCR');
  }

  const info = metadata.info as Record<string, unknown> | null;

  return {
    text: fullText.trim(),
    pages,
    metadata: info
      ? {
          title: info.Title as string | undefined,
          author: info.Author as string | undefined,
          subject: info.Subject as string | undefined,
        }
      : undefined,
  };
}

/**
 * Preprocess canvas image for better OCR results
 * Applies grayscale conversion, contrast enhancement, and binarization
 */
function preprocessImageForOCR(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convert to grayscale and enhance contrast
  for (let i = 0; i < data.length; i += 4) {
    // Grayscale conversion
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    // Contrast enhancement (increase difference from mid-point)
    const enhanced = gray < 128
      ? Math.max(0, gray - 20)
      : Math.min(255, gray + 20);

    // Binarization (convert to pure black or white)
    const binarized = enhanced > 128 ? 255 : 0;

    data[i] = binarized;     // R
    data[i + 1] = binarized; // G
    data[i + 2] = binarized; // B
    // Alpha channel (data[i + 3]) remains unchanged
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Lazy-load OCR if needed (only if text < 50 chars)
 * Converts PDF pages to images first, then runs OCR on each page
 * Optimized with higher resolution and image preprocessing
 */
export async function extractTextWithOCR(
  file: File
): Promise<ExtractedText> {
  const pdfjs = await getPdfJs();

  try {
    // Load PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    // Dynamic import to reduce bundle size
    const { createWorker, PSM } = await import('tesseract.js');
    const worker = await createWorker('fra+eng', 1, {
      // Optimize Tesseract parameters
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    // Configure Tesseract with optimal parameters
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO, // Automatic page segmentation
      tessedit_char_whitelist: '', // Allow all characters
      preserve_interword_spaces: '1', // Preserve spaces between words
    });

    const pages: string[] = [];
    let fullText = '';

    try {
      // Process each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        // Render page to canvas at high resolution (3x) for better OCR accuracy
        const viewport = page.getViewport({ scale: 3.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Impossible de créer le contexte canvas');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        // Preprocess image for better OCR
        const preprocessedCanvas = preprocessImageForOCR(canvas);

        // Convert canvas to blob for Tesseract
        const blob = await new Promise<Blob>((resolve, reject) => {
          preprocessedCanvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Échec de la conversion canvas en blob'));
            }
          }, 'image/png');
        });

        // Run OCR on the preprocessed page image
        const { data } = await worker.recognize(blob);
        const pageText = data.text.trim();

        // Log confidence for debugging
        console.log(`Page ${i} OCR confidence: ${data.confidence}%`);

        pages.push(pageText);
        fullText += pageText + '\n';
      }

      await worker.terminate();

      return {
        text: fullText.trim(),
        pages,
      };
    } catch (error) {
      await worker.terminate();
      throw error;
    }
  } catch (error) {
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : error}`);
  }
}

