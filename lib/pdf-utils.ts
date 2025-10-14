import { extractText } from 'unpdf';

export interface PageText {
  pageNumber: number;
  text: string;
  startIndex: number; // Start index in combined text
  endIndex: number;   // End index in combined text
}

export interface ExtractedPDFData {
  fullText: string;
  pages: PageText[];
  totalPages: number;
}

/**
 * Extract text from PDF with page number tracking
 * This allows us to map any text position back to its original page
 */
export async function extractTextWithPageNumbers(pdfBuffer: Uint8Array): Promise<ExtractedPDFData> {
  try {
    // Extract text using unpdf
    const { text, totalPages } = await extractText(pdfBuffer, {
      mergePages: false, // Keep pages separate initially
    });

    const pages: PageText[] = [];
    let currentIndex = 0;
    
    // Process each page
    const pageTexts = Array.isArray(text) ? text : [text];
    
    pageTexts.forEach((pageText, index) => {
      const pageContent = pageText || '';
      const startIndex = currentIndex;
      const endIndex = currentIndex + pageContent.length;
      
      pages.push({
        pageNumber: index + 1,
        text: pageContent,
        startIndex,
        endIndex,
      });
      
      // Add space between pages
      currentIndex = endIndex + 1;
    });

    // Combine all pages into full text
    const fullText = pages.map(p => p.text).join(' ');

    return {
      fullText,
      pages,
      totalPages: totalPages || pages.length,
    };
  } catch (error) {
    console.error('Error extracting PDF with page numbers:', error);
    // Fallback to simple extraction
    const { text } = await extractText(pdfBuffer);
    const fullText = Array.isArray(text) ? text.join(' ') : text;
    
    return {
      fullText,
      pages: [{
        pageNumber: 1,
        text: fullText,
        startIndex: 0,
        endIndex: fullText.length,
      }],
      totalPages: 1,
    };
  }
}

/**
 * Find which page contains a specific text excerpt
 */
export function findPageNumber(excerpt: string, pages: PageText[]): number | null {
  if (!excerpt) return null;
  
  // Normalize the excerpt for comparison
  const normalizedExcerpt = excerpt.toLowerCase().trim();
  
  // Search through pages
  for (const page of pages) {
    const normalizedPageText = page.text.toLowerCase();
    if (normalizedPageText.includes(normalizedExcerpt.substring(0, 100))) {
      return page.pageNumber;
    }
  }
  
  return null;
}

/**
 * Find the approximate position of text on a page (for highlighting)
 */
export interface TextPosition {
  pageNumber: number;
  startIndex: number; // Index within the page
  endIndex: number;
  searchText: string;
}

export function findTextPosition(
  excerpt: string,
  pages: PageText[]
): TextPosition | null {
  if (!excerpt) return null;
  
  const normalizedExcerpt = excerpt.toLowerCase().trim();
  
  for (const page of pages) {
    const normalizedPageText = page.text.toLowerCase();
    const index = normalizedPageText.indexOf(normalizedExcerpt.substring(0, 100));
    
    if (index !== -1) {
      return {
        pageNumber: page.pageNumber,
        startIndex: index,
        endIndex: index + excerpt.length,
        searchText: excerpt,
      };
    }
  }
  
  return null;
}

/**
 * Enhanced extraction that preserves document structure
 */
export interface StructuredPDFData extends ExtractedPDFData {
  pdfUrl?: string; // URL to the PDF for viewer
  fileName?: string;
}

