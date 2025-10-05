'use client';

import { useState } from 'react';
import { X, ExternalLink, FileText, BookOpen, Scale, Gavel } from 'lucide-react';

interface LawSource {
  source_type: string;
  source_text: string;
  source_url?: string;
  display_order: number;
}

interface SourcesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  sources: LawSource[];
  state: string;
  city: string;
}

const getSourceIcon = (sourceType: string) => {
  switch (sourceType.toLowerCase()) {
    case 'uniform_law':
      return <Scale className="h-4 w-4" />;
    case 'statute':
      return <BookOpen className="h-4 w-4" />;
    case 'source_2':
    case 'source_3':
    case 'source_4':
    case 'source_5':
      return <FileText className="h-4 w-4" />;
    default:
      return <Gavel className="h-4 w-4" />;
  }
};

const getSourceLabel = (sourceType: string) => {
  switch (sourceType.toLowerCase()) {
    case 'uniform_law':
      return 'Uniform Law';
    case 'statute':
      return 'Statute/Code';
    case 'source_2':
      return 'Source #2';
    case 'source_3':
      return 'Source #3';
    case 'source_4':
      return 'Source #4';
    case 'source_5':
      return 'Source #5';
    default:
      return sourceType;
  }
};

const isUrl = (text: string) => {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
};

export default function SourcesPopup({ isOpen, onClose, sources, state, city }: SourcesPopupProps) {
  if (!isOpen) return null;

  // Sort sources by display_order
  const sortedSources = [...sources].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Legal Sources</h2>
            <p className="text-sm text-gray-600">{city}, {state}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {sortedSources.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sources Available</h3>
              <p className="text-gray-600">No legal sources found for this location.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedSources.map((source, index) => (
                <div
                  key={`${source.source_type}-${index}`}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1 text-blue-600">
                    {getSourceIcon(source.source_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {getSourceLabel(source.source_type)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-900">
                      {source.source_url || isUrl(source.source_text) ? (
                        <a
                          href={source.source_url || source.source_text}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2"
                        >
                          {source.source_text}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-900">{source.source_text}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Click on any source to open it in a new tab
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
