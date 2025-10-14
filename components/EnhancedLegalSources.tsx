'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Search, FileText, AlertCircle, Loader2, CheckCircle, Copy, Check } from 'lucide-react';
import { createTextFragmentUrl, extractStatuteForFragment } from '@/lib/url-text-fragment';

interface EnhancedLegalSourcesProps {
  rightText: string;
  userAddress: string;
  description: string;
  pdfUrl?: string; // For creating RAG
  leaseContext?: {
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
    address?: string;
  };
}

interface LegalSource {
  url: string;
  title: string;
  statuteText: string;
  explanation: string;
  isRelevant: boolean;
  isVerified?: boolean;
  verificationConfidence?: number;
  shouldShowLink?: boolean;
  shouldShowStatute?: boolean;
  statuteNumber?: string | null;
  application?: string; // How it applies to the user's lease
  hasMatch?: boolean; // Whether we found relevant lease clauses
}

export default function EnhancedLegalSources({ rightText, userAddress, description, pdfUrl, leaseContext }: EnhancedLegalSourcesProps) {
  const [sources, setSources] = useState<LegalSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalSearched: number; notFoundCount: number } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Debug log
  console.log('🔍 EnhancedLegalSources rendered:', {
    rightText: rightText?.slice(0, 50),
    userAddress,
    hasPdfUrl: !!pdfUrl,
    hasLeaseContext: !!leaseContext
  });

  const copyStatuteText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const searchLegalSources = async () => {
    console.log('🚀 searchLegalSources called!');
    console.log('📦 Sending data:', {
      rightText: rightText?.slice(0, 50),
      userAddress,
      description: description?.slice(0, 50),
      pdfUrl: pdfUrl?.slice(0, 50),
      leaseContext
    });
    
    setIsLoading(true);
    setError(null);
    setSources([]);
    setMessage(null);
    setStats(null);
    
    try {
      console.log('📡 Fetching enhanced legal sources...');
      
      const response = await fetch('/api/enhanced-legal-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rightText, 
          userAddress, 
          description,
          pdfUrl,
          leaseContext
        }),
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSources(data.sources || []);
        setMessage(data.message);
        setStats({
          totalSearched: data.totalSearched || 0,
          notFoundCount: data.notFoundCount || 0
        });
        console.log(`✅ Found ${data.sources?.length || 0} vetted legal sources`);
      } else {
        setError(data.error || 'Failed to fetch legal sources');
      }
      
    } catch (err) {
      console.error('❌ Error fetching legal sources:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Button */}
      {sources.length === 0 && !isLoading && (
        <Button
          onClick={searchLegalSources}
          className="w-full sm:w-auto bg-purple-600 text-white hover:bg-purple-700"
          disabled={isLoading}
        >
          <Search className="w-4 h-4 mr-2" />
          Find Legal Sources
        </Button>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8 gap-4 bg-slate-50 rounded-lg border border-slate-200">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <div className="text-center space-y-2">
            <p className="text-slate-700 font-medium">Searching legal sources...</p>
            <p className="text-sm text-slate-500">Fetching and vetting content from authoritative sources</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <Button onClick={searchLegalSources} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      )}

      {/* Message (when no sources found or success) */}
      {message && !isLoading && (
        <div className={`p-4 rounded-lg border ${sources.length === 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-start gap-3">
            {sources.length === 0 ? (
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm ${sources.length === 0 ? 'text-amber-900' : 'text-green-900'} whitespace-pre-line`}>
                {message}
              </p>
              {stats && (
                <p className="text-xs text-slate-600 mt-2">
                  Searched: {stats.totalSearched} sources • Not relevant: {stats.notFoundCount}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legal Sources with Statute Text */}
      {sources.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Legal Sources
            </h4>
            <Button onClick={searchLegalSources} variant="outline" size="sm" disabled={isLoading}>
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {sources.map((source, index) => {
              // Create URL with text fragment to scroll to exact text
              const textForFragment = extractStatuteForFragment(source.statuteText, source.statuteNumber || undefined);
              const urlWithFragment = source.shouldShowLink 
                ? createTextFragmentUrl(source.url, textForFragment)
                : source.url;
              
              return (
              <div
                key={index}
                className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header with Title (and Link ONLY if verified) */}
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold text-slate-900">
                          {source.title}
                        </h5>
                        {/* Verification Badge */}
                        {source.isVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            ✓ Verified {source.verificationConfidence && `${source.verificationConfidence.toFixed(0)}%`}
                          </span>
                        )}
                      </div>
                      {/* Show URL ONLY if shouldShowLink is true */}
                      {source.shouldShowLink && (
                        <p className="text-xs text-slate-500 mt-1 truncate" title={urlWithFragment}>
                          {source.url}
                        </p>
                      )}
                      {!source.shouldShowLink && (
                        <p className="text-xs text-amber-600 mt-1">Source link not verified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Statute Text (ONLY if shouldShowStatute is true) */}
                <div className="p-4 space-y-3">
                  {source.shouldShowStatute && source.statuteText ? (
                    <>
                      {/* Statute Number with Tooltip */}
                      {source.statuteNumber && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                            {source.statuteNumber}
                          </span>
                          {/* Info Icon with Tooltip */}
                          <div className="group relative">
                            <button 
                              className="inline-flex items-center justify-center w-4 h-4 text-slate-400 hover:text-purple-600 transition-colors"
                              title="View statute text"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            {/* Tooltip - shows on hover */}
                            <div className="hidden group-hover:block absolute z-50 left-0 top-6 w-96 max-w-[90vw] bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl">
                              <div className="font-semibold mb-1">Full Statute Text:</div>
                              <div className="font-mono text-slate-200 leading-relaxed max-h-60 overflow-y-auto">
                                {source.statuteText}
                              </div>
                              {/* Arrow */}
                              <div className="absolute -top-1 left-2 w-2 h-2 bg-slate-900 transform rotate-45"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Statute Text Box with Copy Button */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                            Legal Text
                          </p>
                          <button
                            onClick={() => copyStatuteText(source.statuteText, index)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Copy text to search manually on page"
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-sm text-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
                          {source.statuteText}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          💡 Tip: If the link doesn't scroll to the text, use the Copy button and press Ctrl/Cmd+F to search on the page
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <p className="text-sm text-amber-900">
                        ⚠️ Statute text could not be verified for accuracy. We recommend consulting an attorney for the specific legal text.
                      </p>
                    </div>
                  )}

                  {/* How It Applies to Your Lease (if available) */}
                  {source.application ? (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5" />
                        How It Applies to Your Lease
                      </p>
                      <p className="text-sm text-purple-900 leading-relaxed font-medium">
                        {source.application}
                      </p>
                      {!source.hasMatch && (
                        <p className="text-xs text-purple-600 mt-2 italic">
                          Note: Your lease doesn't specifically mention this, but the law still applies.
                        </p>
                      )}
                    </div>
                  ) : source.explanation ? (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                        What This Means
                      </p>
                      <p className="text-sm text-blue-900 leading-relaxed">
                        {source.explanation}
                      </p>
                    </div>
                  ) : null}

                  {/* View Full Page Button (ONLY if shouldShowLink is true) */}
                  {source.shouldShowLink && (
                    <a
                      href={urlWithFragment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 hover:underline font-medium"
                      title="Opens page and scrolls to the exact statute text"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Exact Text in Source
                    </a>
                  )}
                </div>
              </div>
            );
            })}
          </div>

          {/* Footer Info */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-900">
              ⚠️ <strong>Legal Information Only:</strong> This is not legal advice. The text above is extracted from legal sources but may not include all relevant information. Always consult with a qualified attorney for legal advice specific to your situation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

