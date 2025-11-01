import { LlamaParseReader } from 'llama-cloud-services';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface PageText {
  pageNumber: number;
  text: string;
  startIndex: number;
  endIndex: number;
}

export interface ExtractedPDFData {
  fullText: string;
  pages: PageText[];
  totalPages: number;
}

/**
 * Extract text from PDF using LlamaParse with page number tracking
 * This provides much better OCR and structure preservation than unpdf
 */
export async function extractTextWithPageNumbers(pdfBuffer: Uint8Array): Promise<ExtractedPDFData> {
  let tmpFilePath: string | null = null;
  
  try {
    // console.log('🦙 Starting LlamaParse extraction...');
    
    // Initialize LlamaParse reader with markdown output
    const reader = new LlamaParseReader({ 
      resultType: "markdown",
      apiKey: process.env.LLAMA_CLOUD_API_KEY,
    });

    // Write buffer to a temporary file (LlamaParse expects a file path)
    const tmpDir = os.tmpdir();
    tmpFilePath = path.join(tmpDir, `lease-${Date.now()}.pdf`);
    
    await fs.writeFile(tmpFilePath, pdfBuffer);
    // console.log(`📁 Temporary file created: ${tmpFilePath}`);

    // console.log('📤 Sending PDF to LlamaParse...');
    
    // Parse the document using LlamaParse (pass file path as string)
    const documents = await reader.loadData(tmpFilePath);
    
    // console.log(`✅ LlamaParse returned ${documents.length} document(s)`);

    if (!documents || documents.length === 0) {
      throw new Error('LlamaParse returned no documents');
    }

    // Process the parsed documents
    // LlamaParse may return multiple documents or one large document
    const pages: PageText[] = [];
    let currentIndex = 0;
    let fullTextParts: string[] = [];

    // Check if documents have page information in metadata
    if (documents.length > 1) {
      // Multiple documents likely means multiple pages
      documents.forEach((doc, index) => {
        const pageText = doc.text || '';
        const startIndex = currentIndex;
        const endIndex = currentIndex + pageText.length;
        
        pages.push({
          pageNumber: index + 1,
          text: pageText,
          startIndex,
          endIndex,
        });
        
        fullTextParts.push(pageText);
        currentIndex = endIndex + 1; // +1 for space between pages
      });
    } else {
      // Single document - try to split by page markers in markdown
      const fullMarkdown = documents[0].text || '';
      
      // LlamaParse markdown often has page breaks indicated by headers or ---
      // Try to split intelligently by looking for page markers
      const pageMarkers = fullMarkdown.split(/(?=^---\s*$)/gm);
      
      if (pageMarkers.length > 1) {
        // Found page markers
        pageMarkers.forEach((pageContent, index) => {
          const pageText = pageContent.replace(/^---\s*$/gm, '').trim();
          if (pageText) {
            const startIndex = currentIndex;
            const endIndex = currentIndex + pageText.length;
            
            pages.push({
              pageNumber: index + 1,
              text: pageText,
              startIndex,
              endIndex,
            });
            
            fullTextParts.push(pageText);
            currentIndex = endIndex + 1;
          }
        });
      } else {
        // No clear page markers - treat as single page or estimate pages
        // Estimate pages based on typical page length (~3000 chars)
        const avgPageLength = 3000;
        const estimatedPages = Math.max(1, Math.ceil(fullMarkdown.length / avgPageLength));
        
        if (estimatedPages === 1) {
          // Single page document
          pages.push({
            pageNumber: 1,
            text: fullMarkdown,
            startIndex: 0,
            endIndex: fullMarkdown.length,
          });
          fullTextParts.push(fullMarkdown);
        } else {
          // Split into estimated pages
          const chunkSize = Math.ceil(fullMarkdown.length / estimatedPages);
          for (let i = 0; i < estimatedPages; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, fullMarkdown.length);
            const pageText = fullMarkdown.slice(start, end);
            
            pages.push({
              pageNumber: i + 1,
              text: pageText,
              startIndex: currentIndex,
              endIndex: currentIndex + pageText.length,
            });
            
            fullTextParts.push(pageText);
            currentIndex += pageText.length + 1;
          }
        }
      }
    }

    const fullText = fullTextParts.join(' ');

    // console.log(`✅ LlamaParse extraction complete:`, {
    //   totalPages: pages.length,
    //   totalChars: fullText.length,
    //   avgPageLength: Math.round(fullText.length / pages.length),
    // });

    // Clean up temporary file
    if (tmpFilePath) {
      try {
        await fs.unlink(tmpFilePath);
        // console.log(`🗑️ Temporary file deleted: ${tmpFilePath}`);
      } catch (cleanupError) {
        console.warn(`⚠️ Could not delete temporary file: ${tmpFilePath}`, cleanupError);
      }
    }

    return {
      fullText,
      pages,
      totalPages: pages.length,
    };

  } catch (error) {
    console.error('🚨 LlamaParse extraction failed:', error);
    
    // Clean up temp file on error
    if (tmpFilePath) {
      try {
        await fs.unlink(tmpFilePath);
        // console.log(`🗑️ Temporary file deleted (after error): ${tmpFilePath}`);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
    
    throw new Error(`LlamaParse extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Find which page contains a specific text excerpt
 */
export function findPageNumber(excerpt: string, pages: PageText[]): number | null {
  if (!excerpt) return null;
  
  const normalizedExcerpt = excerpt.toLowerCase().trim();
  
  for (const page of pages) {
    const normalizedPageText = page.text.toLowerCase();
    if (normalizedPageText.includes(normalizedExcerpt.substring(0, 100))) {
      return page.pageNumber;
    }
  }
  
  return null;
}

/**
 * Find the approximate position of text on a page
 */
export interface TextPosition {
  pageNumber: number;
  startIndex: number;
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
 * Enhanced extraction data with PDF metadata
 */
export interface StructuredPDFData extends ExtractedPDFData {
  pdfUrl?: string;
  fileName?: string;
}
