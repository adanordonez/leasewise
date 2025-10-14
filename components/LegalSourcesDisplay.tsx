'use client';

import { useState } from 'react';
import { ExternalLink, Scale, Search, Loader2 } from 'lucide-react';

interface LegalSource {
  url: string;
  title: string;
  snippet: string;
}

interface LegalSourcesDisplayProps {
  rightText: string;
  userAddress: string;
  description?: string;
}

export default function LegalSourcesDisplay({
  rightText,
  userAddress,
  description,
}: LegalSourcesDisplayProps) {
  const [sources, setSources] = useState<LegalSource[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string>('');

  const searchSources = async () => {
    if (sources.length > 0) {
      // Already loaded, just toggle
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔍 Fetching legal sources for:', rightText);

      const response = await fetch('/api/search-legal-sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          singleRight: {
            right: rightText,
            description,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch legal sources');
      }

      const data = await response.json();

      if (data.success && data.result) {
        setSources(data.result.sources || []);
        setSummary(data.result.summary || '');
        setIsExpanded(true);
        console.log(`✅ Found ${data.result.sources?.length || 0} sources`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('❌ Error fetching legal sources:', err);
      setError('Unable to load legal sources. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-2">
      {/* Button to search/toggle sources */}
      <button
        onClick={searchSources}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Searching legal sources...
          </>
        ) : sources.length > 0 ? (
          <>
            <Scale className="w-3 h-3" />
            {isExpanded ? 'Hide' : 'View'} Legal Sources ({sources.length})
          </>
        ) : (
          <>
            <Search className="w-3 h-3" />
            Find Legal Sources
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Expanded sources display */}
      {isExpanded && sources.length > 0 && (
        <div className="mt-3 space-y-3">
          {/* Summary with better formatting */}
          {summary && (
            <div className="p-5 bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl shadow-sm">
              <div className="prose prose-sm max-w-none">
                <div 
                  className="text-slate-800 leading-relaxed space-y-3"
                  dangerouslySetInnerHTML={{ 
                    __html: summary
                      // Convert markdown bold to HTML
                      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900 font-semibold">$1</strong>')
                      // Convert bullet points to proper list items
                      .replace(/^• (.+)$/gm, '<li class="ml-4">$1</li>')
                      // Wrap consecutive list items in ul
                      .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc ml-4 space-y-1 my-2">$&</ul>')
                      // Convert line breaks to paragraphs
                      .split('\n\n')
                      .map(p => p.trim() ? `<p class="mb-2">${p}</p>` : '')
                      .join('')
                  }}
                />
              </div>
            </div>
          )}

          {/* Sources - Only show the most relevant ones */}
          {sources.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-slate-600" />
                <h4 className="text-sm font-semibold text-slate-700">
                  Official Legal Sources
                </h4>
              </div>
              
              {sources.slice(0, 5).map((source, idx) => {
                // Determine source type from domain
                const hostname = new URL(source.url).hostname;
                const isGov = hostname.includes('.gov');
                const sourceType = isGov ? 'Government' : 'Legal Resource';
                const iconColor = isGov ? 'text-blue-600' : 'text-purple-600';
                const bgColor = isGov ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200';
                
                return (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block p-3 border-2 rounded-lg hover:shadow-md transition-all group ${bgColor}`}
                  >
                    <div className="flex items-start gap-3">
                      <ExternalLink className={`w-4 h-4 ${iconColor} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${iconColor} uppercase tracking-wide`}>
                            {sourceType}
                          </span>
                        </div>
                        <h5 className="text-sm font-semibold text-slate-900 group-hover:text-purple-700 transition-colors mb-1 line-clamp-2">
                          {source.title}
                        </h5>
                        <p className="text-xs text-slate-600 font-mono">
                          {hostname}
                        </p>
                      </div>
                    </div>
                  </a>
                );
              })}
              
              {sources.length > 5 && (
                <p className="text-xs text-slate-500 text-center pt-2">
                  + {sources.length - 5} more source{sources.length - 5 > 1 ? 's' : ''} consulted
                </p>
              )}
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-900">
              ⚠️ <strong>Legal Information Only:</strong> This is not legal advice. 
              Laws may have changed since this information was gathered. 
              Consult a licensed attorney for advice specific to your situation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

