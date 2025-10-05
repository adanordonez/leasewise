'use client';

import { ExternalLink, FileText, BookOpen, Scale, Gavel } from 'lucide-react';

interface LawSource {
  source_type: string;
  source_text: string;
  source_url?: string;
  display_order: number;
}

interface LawSourcesProps {
  sources: LawSource[];
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

export default function LawSources({ sources }: LawSourcesProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  // Sort sources by display_order
  const sortedSources = [...sources].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Legal Sources
      </h4>
      
      <div className="space-y-2">
        {sortedSources.map((source, index) => (
          <div
            key={`${source.source_type}-${index}`}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5 text-blue-600">
              {getSourceIcon(source.source_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {getSourceLabel(source.source_type)}
                </span>
              </div>
              
              <div className="text-sm text-gray-900">
                {source.source_url || isUrl(source.source_text) ? (
                  <a
                    href={source.source_url || source.source_text}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
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
    </div>
  );
}
