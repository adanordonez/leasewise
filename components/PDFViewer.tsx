'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from 'lucide-react';

// Note: CSS imports removed as they may not be available in all react-pdf versions
// The component will still work without them, just with slightly different styling

// Configure PDF.js worker
// Use local worker file for better reliability and faster loading
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PDFViewerProps {
  pdfUrl: string;
  pageNumber?: number;
  searchText?: string;
  onClose?: () => void;
}

export default function PDFViewer({ 
  pdfUrl, 
  pageNumber: initialPage = 1, 
  searchText,
  onClose 
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightPositions, setHighlightPositions] = useState<Array<{x: number, y: number, width: number, height: number}>>([]);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageNumber(initialPage);
  }, [initialPage]);

  // No highlighting - just show the page
  async function findTextOnPage(page: any, searchString: string) {
    // Disabled: Just showing the page number is enough
    // Highlighting is too unreliable across different PDF formats
    return [];
  }

  async function onPageLoadSuccess(page: any) {
    if (searchText && page) {
      const matches = await findTextOnPage(page, searchText);
      setHighlightPositions(matches);
    }
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
  }

  function changePage(offset: number) {
    setHighlightPositions([]); // Clear highlights when changing pages
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset;
      return Math.min(Math.max(1, newPage), numPages);
    });
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function zoomIn() {
    setScale(prevScale => Math.min(prevScale + 0.2, 2.0));
  }

  function zoomOut() {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Lease Document
            </h3>
            {searchText && (
              <span className="text-sm text-slate-600 bg-yellow-50 px-3 py-1 rounded-full">
                {highlightPositions.length > 0 
                  ? `${highlightPositions.length} match${highlightPositions.length > 1 ? 'es' : ''} highlighted`
                  : 'Searching for matches...'}
              </span>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <button
              onClick={previousPage}
              disabled={pageNumber <= 1}
              className="p-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="text-sm text-slate-700 min-w-[100px] text-center">
              Page {pageNumber} of {numPages || '...'}
            </span>
            
            <button
              onClick={nextPage}
              disabled={pageNumber >= numPages}
              className="p-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            
            <span className="text-sm text-slate-700 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={zoomIn}
              disabled={scale >= 2.0}
              className="p-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-slate-100 p-6 flex items-start justify-center">
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600">Loading PDF...</p>
            </div>
          )}
          
          <div ref={pageContainerRef} className="relative">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => console.error('Error loading PDF:', error)}
              className="shadow-lg"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="bg-white"
                onLoadSuccess={onPageLoadSuccess}
              />
            </Document>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 text-center">
            The PDF has been opened to page {pageNumber} where the source text is located. Use the controls above to navigate and zoom.
          </p>
        </div>
      </div>
    </div>
  );
}

