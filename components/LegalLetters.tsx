'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Sparkles } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  QuillWrite02Icon, 
  DownloadSquare02Icon, 
  ArrowLeft02Icon,
  Edit02Icon,
  Copy01Icon,
  CheckmarkCircle01Icon
} from '@hugeicons-pro/core-stroke-rounded';
import { Alert02Icon } from '@hugeicons-pro/core-solid-rounded';
import jsPDF from 'jspdf';

interface LegalLettersProps {
  leaseDataId: string;
  userEmail: string;
  userName: string;
  address: string;
  analysisResult: any;
}

type LetterType = 'securityDeposit';

export default function LegalLetters({ 
  leaseDataId, 
  userEmail, 
  userName, 
  address, 
  analysisResult 
}: LegalLettersProps) {
  const t = useTranslations();
  const [selectedLetter, setSelectedLetter] = useState<LetterType | null>(null);
  const [landlordName, setLandlordName] = useState('');
  const [landlordAddress, setLandlordAddress] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [editedLetter, setEditedLetter] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExtractingInfo, setIsExtractingInfo] = useState(false);

  // Auto-extract landlord info when a letter type is selected
  useEffect(() => {
    if (selectedLetter && leaseDataId) {
      extractLandlordInfo();
    }
  }, [selectedLetter, leaseDataId]);

  const extractLandlordInfo = async () => {
    setIsExtractingInfo(true);
    try {
      const response = await fetch('/api/extract-landlord-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseDataId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.landlordName) {
          setLandlordName(data.landlordName);
        }
        if (data.landlordAddress) {
          setLandlordAddress(data.landlordAddress);
        }
        console.log('✅ Auto-extracted landlord info:', data);
      }
    } catch (error) {
      console.error('Error extracting landlord info:', error);
      // Silently fail - user can still enter manually
    } finally {
      setIsExtractingInfo(false);
    }
  };

  const handleGenerate = async () => {
    if (!landlordName.trim()) {
      return;
    }

    setIsGenerating(true);
    let response;
    try {
      response = await fetch('/api/generate-legal-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaseDataId,
          letterType: selectedLetter,
          landlordName: landlordName.trim(),
          landlordAddress: landlordAddress.trim(),
          additionalDetails: additionalDetails.trim(),
          userName,
          userEmail,
          tenantAddress: address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to generate letter');
      }

      const data = await response.json();
      setGeneratedLetter(data.letter);
      setEditedLetter(data.letter);
      setIsEditing(false);
    } catch (error) {
      console.error('Error generating letter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to generate letter: ${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!editedLetter) return;
    
    try {
      await navigator.clipboard.writeText(editedLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownloadPDF = () => {
    if (!editedLetter) return;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });

      // Add letter content
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const maxLineWidth = pageWidth - (margin * 2);

      // Split text into lines and pages
      pdf.setFont('times', 'normal');
      pdf.setFontSize(12);
      
      const lines = pdf.splitTextToSize(editedLetter, maxLineWidth);
      let y = margin;
      const lineHeight = 7;

      lines.forEach((line: string) => {
        if (y + lineHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += lineHeight;
      });

      // Download PDF
      const fileName = `${selectedLetter}_letter_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try copying the text instead.');
    }
  };

  const handleReset = () => {
    setSelectedLetter(null);
    setLandlordName('');
    setLandlordAddress('');
    setAdditionalDetails('');
    setGeneratedLetter(null);
    setEditedLetter('');
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  // Letter Preview
  if (generatedLetter) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <HugeiconsIcon icon={QuillWrite02Icon} size={20} strokeWidth={1.5} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{t('LegalLetters.preview.title')}</h3>
                  <p className="text-sm text-slate-600">{t(`LegalLetters.letterTypes.${selectedLetter}.name`)}</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2"
              >
                <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={1.5} />
                {t('LegalLetters.preview.newLetter')}
              </button>
            </div>
          </div>

          {/* Letter Content with Actions */}
          <div className="p-8">
            <div className="flex justify-end mb-4 gap-3 flex-wrap">
              {isEditing ? (
                <button
                  onClick={handleSaveEdit}
                  className="inline-flex h-10 items-center justify-center gap-2 px-5 rounded-[10px] bg-green-600 text-white font-medium text-sm hover:bg-green-700 active:bg-green-800 transition-all duration-200 shadow-sm"
                >
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} strokeWidth={1.5} />
                  Save Changes
                </button>
              ) : (
                <button
                  onClick={handleEdit}
                  className="inline-flex h-10 items-center justify-center gap-2 px-5 rounded-[10px] bg-white text-slate-700 font-medium text-sm border border-slate-300 hover:bg-slate-50 active:bg-slate-100 transition-all duration-200 shadow-sm"
                >
                  <HugeiconsIcon icon={Edit02Icon} size={18} strokeWidth={1.5} />
                  Edit Letter
                </button>
              )}
              <button
                onClick={handleCopy}
                disabled={isEditing}
                className="inline-flex h-10 items-center justify-center gap-2 px-5 rounded-[10px] bg-white text-slate-700 font-medium text-sm border border-slate-300 hover:bg-slate-50 active:bg-slate-100 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                {copied ? (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} strokeWidth={1.5} className="text-green-600" />
                    <span className="text-green-600">{t('LegalLetters.preview.copied')}</span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Copy01Icon} size={18} strokeWidth={1.5} />
                    {t('LegalLetters.preview.copy')}
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isEditing}
                className="inline-flex h-10 items-center justify-center gap-2 px-5 rounded-[10px] bg-[#6039B3] text-white font-medium text-sm hover:bg-[#5030A0] active:bg-[#4829A0] transition-all duration-200 shadow-[0_-2px_4px_0_rgba(0,0,0,0.20)_inset,0_2px_4px_0_rgba(255,255,255,0.20)_inset] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HugeiconsIcon icon={DownloadSquare02Icon} size={18} strokeWidth={1.5} />
                Download PDF
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={editedLetter}
                onChange={(e) => setEditedLetter(e.target.value)}
                className="w-full min-h-[600px] p-8 border border-slate-300 rounded-lg font-serif text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px' }}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-8 font-serif text-slate-800 whitespace-pre-wrap leading-relaxed">
                {editedLetter}
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
            <p className="text-xs text-slate-600 flex items-start gap-2">
              <HugeiconsIcon icon={Alert02Icon} size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <span>{t('LegalLetters.disclaimer')}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Letter Selection or Form
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <HugeiconsIcon icon={QuillWrite02Icon} size={24} strokeWidth={1.5} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{t('LegalLetters.header.title')}</h3>
              <p className="text-sm text-slate-600 mt-1">{t('LegalLetters.header.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!selectedLetter ? (
            // Letter Type Selection
            <div>
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-2">{t('LegalLetters.selectLetter.title')}</h4>
                <p className="text-sm text-slate-600">{t('LegalLetters.selectLetter.description')}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setSelectedLetter('securityDeposit')}
                  className="w-full text-left p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <HugeiconsIcon icon={QuillWrite02Icon} size={24} strokeWidth={1.5} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-base font-semibold text-slate-900 mb-1">
                        {t('LegalLetters.letterTypes.securityDeposit.name')}
                      </h5>
                      <p className="text-sm text-slate-600">
                        {t('LegalLetters.letterTypes.securityDeposit.description')}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            // Letter Form
            <div>
              <button
                onClick={() => setSelectedLetter(null)}
                className="mb-6 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={1.5} />
                Back to letter selection
              </button>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-1">
                  {t(`LegalLetters.letterTypes.${selectedLetter}.name`)}
                </h4>
                <p className="text-sm text-slate-600">
                  {t(`LegalLetters.letterTypes.${selectedLetter}.description`)}
                </p>
              </div>

              {isExtractingInfo && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Extracting landlord information from your lease...
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      This will only take a moment
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('LegalLetters.form.landlordName')} *
                    {landlordName && !isExtractingInfo && (
                      <span className="ml-2 text-xs text-green-600 font-normal">
                        ✓ Auto-extracted
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={landlordName}
                    onChange={(e) => setLandlordName(e.target.value)}
                    placeholder={isExtractingInfo ? "Extracting..." : "Enter landlord name"}
                    disabled={isExtractingInfo}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-slate-50 disabled:cursor-wait"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('LegalLetters.form.landlordAddress')}
                    {landlordAddress && !isExtractingInfo && (
                      <span className="ml-2 text-xs text-green-600 font-normal">
                        ✓ Auto-extracted
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={landlordAddress}
                    onChange={(e) => setLandlordAddress(e.target.value)}
                    placeholder={isExtractingInfo ? "Extracting..." : "123 Main St, City, State ZIP (Optional)"}
                    disabled={isExtractingInfo}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-slate-50 disabled:cursor-wait"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {isExtractingInfo ? (
                      <span className="text-blue-600">Searching your lease for landlord address...</span>
                    ) : (
                      <>Your address ({address}) will be used as your return address in the letter.</>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('LegalLetters.form.additionalDetails')}
                  </label>
                  <textarea
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder={t('LegalLetters.form.additionalDetailsPlaceholder')}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !landlordName.trim()}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('LegalLetters.form.generating')}
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={QuillWrite02Icon} size={20} strokeWidth={1.5} />
                      {t('LegalLetters.form.generate')}
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  {t('LegalLetters.disclaimer')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

