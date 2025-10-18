'use client';

import { useState } from 'react';
import { X, ExternalLink, MessageCircle } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { DocumentAttachmentIcon } from '@hugeicons-pro/core-stroke-rounded';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false,
  loading: () => <div className="text-center py-4">Loading PDF viewer...</div>
});

interface SourceCitationProps {
  sourceText?: string;
  label?: string;
  pageNumber?: number;
  pdfUrl?: string;
  searchText?: string; // Text to highlight in PDF
}

export default function SourceCitation({ 
  sourceText, 
  label, 
  pageNumber,
  pdfUrl,
  searchText 
}: SourceCitationProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [showFullPdf, setShowFullPdf] = useState(false);
  const [plainEnglish, setPlainEnglish] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  if (!sourceText) return null;

  // Translate legal text to plain English
  const translateToPlainEnglish = async () => {
    if (plainEnglish) {
      setPlainEnglish(null); // Toggle off if already showing
      return;
    }

    setIsTranslating(true);
    console.log('🔄 Starting translation for text:', sourceText.substring(0, 50) + '...');
    
    try {
      const response = await fetch('/api/translate-legal-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legalText: sourceText }),
      });

      console.log('📡 Translation API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Translation API error:', errorData);
        throw new Error(errorData.error || 'Translation failed');
      }

      const data = await response.json();
      console.log('✅ Translation received:', data.plainEnglish);
      setPlainEnglish(data.plainEnglish);
    } catch (error) {
      console.error('❌ Error translating text:', error);
      setPlainEnglish(t('SourceCitation.translationError'));
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <>
      {/* Clickable icon */}
      <button
        onClick={() => {
          console.log('📄 Source citation clicked!', { hasSourceText: !!sourceText, pageNumber });
          setIsOpen(true);
        }}
        className="inline-flex items-center justify-center w-5 h-5 ml-2 text-slate-400 hover:text-purple-600 transition-colors"
        title="View source from lease"
      >
        <HugeiconsIcon icon={DocumentAttachmentIcon} size={16} strokeWidth={1.5} />
      </button>

      {/* Modal/Popup */}
      {isOpen && ((() => {
        console.log('🎨 Modal rendering!', { sourceText: sourceText?.substring(0, 50), pageNumber, pdfUrl: !!pdfUrl });
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                  <HugeiconsIcon icon={DocumentAttachmentIcon} size={20} strokeWidth={1.5} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{label}</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Legal Text */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600">{t('SourceCitation.excerptFromLease')}</p>
                  {pageNumber && (
                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      {t('SourceCitation.page')} {pageNumber}
                    </span>
                  )}
                </div>
                <p className="text-slate-800 leading-relaxed italic">
                  "{sourceText}"
                </p>
              </div>

              {/* Plain English Translation */}
              {plainEnglish && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-800">{t('SourceCitation.plainTranslation')}</p>
                  </div>
                  <p className="text-green-900 leading-relaxed">
                    {plainEnglish}
                  </p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    console.log('💬 Translation button clicked!');
                    translateToPlainEnglish();
                  }}
                  disabled={isTranslating}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-lg transition-colors shadow-lg"
                >
                  <MessageCircle className="w-4 h-4" />
                  {isTranslating 
                    ? t('SourceCitation.translating')
                    : plainEnglish 
                      ? t('SourceCitation.hideTranslation')
                      : t('SourceCitation.explainInPlainEnglish')}
                </button>
                
                {pdfUrl && (
                  <button
                    onClick={() => setShowFullPdf(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t('SourceCitation.viewOriginalPDF')}
                  </button>
                )}
              </div>
              
              <div className="mt-4 text-xs text-slate-500">
                <p>{t('SourceCitation.exactText')}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                {t('SourceCitation.close')}
              </button>
            </div>
          </div>
        </div>
        );
      })())}

      {/* Full PDF Viewer */}
      {showFullPdf && pdfUrl && (
        <PDFViewer
          pdfUrl={pdfUrl}
          pageNumber={pageNumber}
          searchText={searchText || sourceText}
          onClose={() => setShowFullPdf(false)}
        />
      )}
    </>
  );
}

