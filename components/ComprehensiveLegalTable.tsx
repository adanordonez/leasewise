'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Search, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CourtLawIcon } from '@hugeicons-pro/core-stroke-rounded';
import { useTranslations } from 'next-intl';
import type { VerifiedLegalInfo } from '@/lib/verified-legal-search-simple';

interface ComprehensiveLegalTableProps {
  userAddress: string;
  pdfUrl?: string; // For RAG analysis
  leaseContext?: {
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
  };
}

export default function ComprehensiveLegalTable({ userAddress, pdfUrl, leaseContext }: ComprehensiveLegalTableProps) {
  const t = useTranslations();
  const [legalInfo, setLegalInfo] = useState<VerifiedLegalInfo[]>([]);
  const [filteredInfo, setFilteredInfo] = useState<VerifiedLegalInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{ state: string; city: string; totalSources: number; verifiedSources?: number; rejectedSources?: number } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false); // Start expanded for auto-load

  const fetchLegalInfo = async () => {
    setIsLoading(true);
    setError(null);
    setIsCollapsed(false); // Expand when fetching
    
    try {
      console.log('📡 Fetching comprehensive legal info...');
      console.log('📄 Lease context:', leaseContext);
      
      const response = await fetch('/api/comprehensive-legal-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userAddress, 
          leaseContext,
          pdfUrl 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch legal information');
      }
      
      const data = await response.json();
      console.log(`✅ Received ${data.legalInfo.length} legal categories`);
      
      setLegalInfo(data.legalInfo);
      setFilteredInfo(data.legalInfo);
      setMetadata(data.searchMetadata);
      
    } catch (err: any) {
      console.error('❌ Error fetching legal info:', err);
      setError(err.message || 'Failed to load legal information');
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically fetch legal info when component mounts
  useEffect(() => {
    if (userAddress && !legalInfo.length && !isLoading && !error) {
      console.log('🚀 Auto-loading legal information...');
      fetchLegalInfo();
    }
  }, [userAddress]); // Only run when userAddress is available

  // Filter legal info based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInfo(legalInfo);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = legalInfo.filter(
      (item) =>
        item.lawType.toLowerCase().includes(term) ||
        item.explanation.toLowerCase().includes(term) ||
        item.example.toLowerCase().includes(term) ||
        (item.statute && item.statute.toLowerCase().includes(term))
    );
    
    setFilteredInfo(filtered);
  }, [searchTerm, legalInfo]);

  // Don't show anything if auto-loading
  if (!legalInfo.length && !isLoading && !error) {
    return null; // Auto-load will trigger
  }

  return (
    <div className="w-full space-y-4">
      {/* Header - Always visible */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <button
            onClick={() => legalInfo.length > 0 && setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity w-full"
          >
            <HugeiconsIcon icon={CourtLawIcon} size={32} strokeWidth={1.5} className="text-purple-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">
                {t('ResultsPage.rights.title')}
              </h3>
              {metadata && (
                <p className="text-sm text-slate-600">
                  {metadata.city && `${metadata.city}, `}{metadata.state} · 10 {t('ResultsPage.rights.keyCategories')}
                </p>
              )}
              {!legalInfo.length && !isLoading && (
                <p className="text-sm text-slate-500">
                  Get comprehensive legal information tailored to your lease
                </p>
              )}
            </div>
            {legalInfo.length > 0 && (
              isCollapsed ? (
                <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
              )
            )}
          </button>
        </div>
        
        <div className="flex gap-2">
          {legalInfo.length > 0 && (
            <Button
              onClick={fetchLegalInfo}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('ResultsPage.rights.refresh')}...
                </>
              ) : (
                t('ResultsPage.rights.refresh')
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <>
          {/* Search Bar */}
          {legalInfo.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t('ResultsPage.rights.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
          <p className="text-sm text-slate-600">
            Searching authoritative legal sources...
          </p>
          <p className="text-xs text-slate-500">
            This may take 10-20 seconds
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Error loading legal information</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Table - Desktop View */}
      {!isLoading && filteredInfo.length > 0 && (
        <>
          <div className="hidden md:block rounded-lg border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-slate-900 font-semibold w-[150px]">
                      {t('ResultsPage.table.headers.lawType')}
                    </TableHead>
                    <TableHead className="text-slate-900 font-semibold min-w-[200px]">
                      {t('ResultsPage.table.headers.whatItSays')}
                    </TableHead>
                    <TableHead className="text-slate-900 font-semibold min-w-[200px]">
                      {t('ResultsPage.table.headers.example')}
                    </TableHead>
                    <TableHead className="text-slate-900 font-semibold w-[120px]">
                      {t('ResultsPage.table.headers.statute')}
                    </TableHead>
                    <TableHead className="text-slate-900 font-semibold w-[150px]">
                      {t('ResultsPage.table.headers.source')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInfo.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50">
                      <TableCell className="font-semibold text-slate-900 align-top">
                        {item.lawType}
                      </TableCell>
                      <TableCell className="text-slate-700 text-sm align-top">
                        {item.explanation}
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm italic align-top">
                        {item.example}
                      </TableCell>
                      <TableCell className="text-slate-800 text-xs font-mono align-top">
                        {item.statute || 'N/A'}
                      </TableCell>
                      <TableCell className="align-top">
                        {item.sourceUrl ? (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">
                              {item.sourceTitle}
                            </span>
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400 italic">
                            No source available
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile View - Cards */}
          <div className="md:hidden space-y-4">
            {filteredInfo.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-white border-2 border-slate-200 rounded-lg shadow-sm space-y-3"
              >
                {/* Law Type Header */}
                <div className="pb-2 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900">{item.lawType}</h4>
                  {item.statute && (
                    <p className="text-xs text-purple-600 font-mono mt-1">{item.statute}</p>
                  )}
                </div>

                {/* Explanation */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    {t('ResultsPage.table.headers.whatItSays')}
                  </p>
                  <p className="text-sm text-slate-800">{item.explanation}</p>
                </div>

                {/* Example */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    Example
                  </p>
                  <p className="text-sm text-slate-700 italic">{item.example}</p>
                </div>

                {/* Source */}
                <div className="pt-2 border-t border-slate-200">
                  {item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 hover:underline font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {item.sourceTitle}
                    </a>
                  ) : (
                    <div className="text-sm text-slate-400 italic">
                      No source available
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* No Results */}
      {!isLoading && filteredInfo.length === 0 && legalInfo.length > 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600">No results found for "{searchTerm}"</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchTerm('')}
            className="mt-4"
          >
            Clear Search
          </Button>
        </div>
      )}

          {/* Footer Stats */}
          {!isLoading && filteredInfo.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                {t('ResultsPage.table.footer.showing')} <strong>{filteredInfo.length}</strong> {t('ResultsPage.table.footer.of')} <strong>{legalInfo.length}</strong> {t('ResultsPage.table.footer.lawCategories')}
              </p>
              
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-900">
                  {t('ResultsPage.table.footer.disclaimer')}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

