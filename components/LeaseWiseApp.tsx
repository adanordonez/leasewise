'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  DocumentAttachmentIcon, 
  Upload01Icon, 
  Download01Icon,
  Calendar03Icon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  Add01Icon,
  Cancel01Icon,
  ChartHistogramIcon,
  ArrowRight01Icon,
  Menu01Icon,
  LinkSquare02Icon,
  CloudUploadIcon,
  UserListIcon,
  Location03Icon,
  DocumentValidationIcon,
  Comment01Icon,
  QuillWrite02Icon,
  ArrowLeft02Icon,
  PlusSignIcon,
  DownloadSquare02Icon,
  AlertSquareIcon,
  CourtLawIcon,
  MapsSearchIcon
} from '@hugeicons-pro/core-stroke-rounded';
import { CircleIcon, Alert02Icon } from '@hugeicons-pro/core-solid-rounded';
import { useTranslations } from 'next-intl';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { SmartExtractionIcon, RedFlagDetectionIcon, KnowYourRightsIcon } from './AnimatedIcons';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SourceCitation from '@/components/SourceCitation';
import ComprehensiveLegalTable from '@/components/ComprehensiveLegalTable';
import EnhancedLegalSources from '@/components/EnhancedLegalSources';
import SimpleLoadingModal from '@/components/SimpleLoadingModal';
import PropertyStreetView from '@/components/PropertyStreetView';
import LanguageToggle from '@/components/LanguageToggle';
import LeaseChat from '@/components/LeaseChat';
import LegalLetters from '@/components/LegalLetters';
import { exportLeaseReportHTML } from '@/lib/export-pdf-html';
import Image from 'next/image';
import { BlurReveal } from '@/components/BlurReveal';

type Page = 'landing' | 'upload' | 'results';

interface AnalysisResult {
  summary: { 
    monthlyRent: string; 
    securityDeposit: string; 
    leaseStart: string; 
    leaseEnd: string; 
    noticePeriod: string;
    sources?: {
      monthlyRent?: string;
      securityDeposit?: string;
      leaseStart?: string;
      leaseEnd?: string;
      noticePeriod?: string;
    };
    pageNumbers?: {
      monthlyRent?: number;
      securityDeposit?: number;
      leaseStart?: number;
      leaseEnd?: number;
      noticePeriod?: number;
    };
  };
  redFlags: Array<{ issue: string; severity: string; explanation: string; source?: string; page_number?: number }>;
  rights: Array<{ right: string; law: string; source?: string; page_number?: number }>;
  keyDates: Array<{ event: string; date: string; description: string; source?: string; page_number?: number }>;
  pdfUrl?: string; // URL to the PDF for viewing
}

interface Scenarios {
  scenarios: Array<{ 
    title: string; 
    advice: string;
    stateLaw?: {
      lawType: string;
      explanation: string;
      statute?: string;
      sourceUrl?: string;
    };
    leaseRelevantText?: string;
    pageNumber?: number;
    severity?: 'high' | 'medium' | 'low';
    actionableSteps?: string[];
  }>;
}

export default function LeaseWiseApp() {
  const t = useTranslations();
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [address, setAddress] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [scenarios, setScenarios] = useState<Scenarios | null>(null);
  const [leaseDataId, setLeaseDataId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat' | 'letters'>('analysis');
  const [isScenariosLoading, setIsScenariosLoading] = useState(false);

  // Function to load scenarios separately
  const loadScenarios = async (leaseId: string) => {
    console.log('📋 Loading scenarios for lease:', leaseId);
    setIsScenariosLoading(true);
    
    try {
      const response = await fetch('/api/generate-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseDataId: leaseId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to load scenarios');
      }
      
      const data = await response.json();
      console.log('✅ Scenarios loaded:', data.scenarios.length);
      setScenarios({ scenarios: data.scenarios });
    } catch (error) {
      console.error('❌ Error loading scenarios:', error);
      // Set empty scenarios as fallback
      setScenarios({ scenarios: [] });
    } finally {
      setIsScenariosLoading(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check file size limits - all files go to Supabase
    const maxSupabaseSize = 50 * 1024 * 1024; // 50MB for Supabase upload
    
    // Check if Supabase is configured
    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!hasSupabase) {
      setError('Supabase not configured. Please set up Supabase environment variables to upload files.');
      return;
    }
    
    if (file.size > maxSupabaseSize) {
      setError('File too large. Maximum size is 50MB.');
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Invalid file type. Only PDF files are supported');
      return;
    }
    
    setError(null);
    setUploadedFile(file);
    setUploadProgress(100);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      validateAndSetFile(file);
    }
  };

  const handleAnalyze = async () => {
    console.log('🚀 Starting analysis...');
    
    if (!address || !uploadedFile || !userName || !userEmail) {
      setError('Please fill in all required fields: name, email, address, and upload a lease');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    console.log('✅ Validation passed, starting analysis...');
    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress(0);
    setAnalysisStage('Preparing your lease...');
    setAnalysisLogs([]);
    let analysisSuccessful = false;
    
    console.log('📊 Modal should be visible now. isAnalyzing:', true);
    
    // Helper to add logs
    const addLog = (log: string) => {
      setAnalysisLogs(prev => [...prev, log]);
    };

    try {
      let response;
      
      // Check if we have Supabase configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase not configured. Please set up Supabase environment variables to upload files.');
      }

      // Stage 1: Upload (0-20%)
      setAnalysisStage(t('LoadingModal.stages.uploadingDocument'));
      setAnalysisProgress(5);
      addLog(t('LoadingModal.logs.uploadingToStorage'));
      console.log('Uploading file directly to Supabase...');
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const timestamp = Date.now();
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${timestamp}-${uploadedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `leases/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lease-documents')
        .upload(filePath, uploadedFile, {
          contentType: uploadedFile.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new Error(`Failed to upload file to Supabase: ${uploadError.message}`);
      }

      setAnalysisProgress(20);
      addLog(t('LoadingModal.logs.uploadComplete'));
      setAnalysisStage(t('LoadingModal.stages.processingDocument'));

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('lease-documents')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      console.log('File uploaded successfully:', urlData.publicUrl);

      // Save PDF metadata to database
      const { data: pdfUploadData, error: pdfUploadError } = await supabase
        .from('pdf_uploads')
        .insert({
          file_name: uploadedFile.name,
          file_size: uploadedFile.size,
          file_type: uploadedFile.type,
          storage_url: urlData.publicUrl,
          address: address,
        })
        .select()
        .single();

      if (pdfUploadError) {
        console.error('Error saving PDF upload metadata:', pdfUploadError);
        // Don't throw error here, continue with analysis
      }

      // Now analyze the file
      // Stage 2: Analyzing (20-90%)
      setAnalysisStage(t('LoadingModal.stages.extractingText'));
      setAnalysisProgress(30);
      addLog(t('LoadingModal.logs.extractingText'));
      
      setTimeout(() => addLog(t('LoadingModal.logs.initializingRAG')), 1000);
      setTimeout(() => addLog(t('LoadingModal.logs.analyzingClauses')), 3000);
      setTimeout(() => addLog(t('LoadingModal.logs.identifyingRedFlags')), 6000);
      setTimeout(() => addLog(t('LoadingModal.logs.extractingRights')), 9000);
      setTimeout(() => addLog(t('LoadingModal.logs.structuringData')), 12000);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort('timeout');
        }
      }, 180000); // 3 minutes timeout for complex analysis
      
      // Simulate progress during API call
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev < 85) return prev + 1;
          return prev;
        });
      }, 800); // Update every 800ms

      // Update stages during analysis
      setTimeout(() => setAnalysisStage(t('LoadingModal.stages.analyzingTerms')), 3000);
      setTimeout(() => setAnalysisStage(t('LoadingModal.stages.detectingRedFlags')), 10000);
      setTimeout(() => setAnalysisStage(t('LoadingModal.stages.identifyingRights')), 20000);
      setTimeout(() => setAnalysisStage(t('LoadingModal.stages.extractingDates')), 30000);
      setTimeout(() => setAnalysisStage(t('LoadingModal.stages.finalizingAnalysis')), 45000);
      
      try {
        response = await fetch('/api/analyze-lease', { 
        method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfUrl: urlData.publicUrl,
            address,
            userName,
            userEmail
          }),
          signal: controller.signal,
        });
        
        // Clear timeout and interval only after successful response
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
      } catch (error: unknown) {
        // Clear timeout and interval on error
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        
        // Only throw timeout error if it's actually an AbortError due to timeout
        if (error instanceof Error && error.name === 'AbortError') {
          // Check if this was due to our timeout or a network issue
          const wasTimeout = controller.signal.aborted && controller.signal.reason === 'timeout';
          if (wasTimeout) {
            throw new Error('Request timed out. Please try with a smaller file or configure Supabase for better performance.');
          }
        }
        throw error;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      setAnalysisProgress(90);
      setAnalysisStage('Processing results...');
      
      const data = await response.json();
      
      if (data.success) {
        analysisSuccessful = true;
        setAnalysisProgress(100);
        setAnalysisStage('Analysis complete!');
        
        // Small delay to show 100% before transitioning
        setTimeout(() => {
        console.log('📊 Analysis complete! leaseDataId:', data.leaseDataId);
        setAnalysisResult(data.analysis);
        setLeaseDataId(data.leaseDataId);
        setCurrentPage('results');
        
        // Load scenarios separately (won't block UI)
        if (data.leaseDataId) {
          loadScenarios(data.leaseDataId);
        }
        }, 500);
        
        // Show warning if text was chunked
        if (data.chunked) {
          console.warn('Large PDF detected - analysis based on first portion of document');
        }
      } else {
        setError(data.error || 'Failed to analyze lease. Please try again.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      console.error('Analysis error:', error);
      setAnalysisProgress(0);
      setAnalysisStage('');
    } finally {
      setTimeout(() => {
      setIsAnalyzing(false);
        setAnalysisProgress(0);
        setAnalysisStage('');
      }, analysisSuccessful ? 500 : 0);
    }
  };

    return (
      <div className="min-h-screen gradient-bg-modern">
      {/* Analysis Loading Modal - Always rendered */}
      <SimpleLoadingModal
        isOpen={isAnalyzing}
        progress={analysisProgress}
        stage={analysisStage}
        logs={analysisLogs}
      />

      {currentPage === 'landing' && (
        <>
        {/* Navbar - Hidden when analyzing */}
        {!isAnalyzing && (
        <nav className="container mx-auto max-w-7xl py-6 px-6 relative z-50">
          <div className="flex justify-between items-center">
              <button 
                onClick={() => setCurrentPage('landing')}
                className="hover:opacity-80 transition-opacity"
              >
              <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-comfortaa)' }}>LeaseWise</span>
            </button>
            
            <div className="hidden md:flex items-center gap-2">
              {/* Temporarily hidden - Dashboard
              <a 
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Dashboard
              </a>
              */}
              {/* Temporarily hidden - Laws
              <a 
                href="/laws"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Laws
              </a>
              */}
              <LanguageToggle />
              <button 
                onClick={() => setCurrentPage('upload')}
                className="inline-flex h-9 items-center justify-center gap-2 px-4 rounded-[10px] bg-[#6039B3] text-white font-semibold text-sm hover:bg-[#5030A0] active:bg-[#4829A0] transition-all duration-200 shadow-[0_-2px_4px_0_rgba(0,0,0,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset] hover:shadow-[0_-2px_6px_0_rgba(0,0,0,0.35)_inset,0_2px_6px_0_rgba(255,255,255,0.35)_inset] transform hover:-translate-y-0.5"
              >
                {t('Nav.getStarted')}
              </button>
            </div>

            <button className="md:hidden p-2">
              <HugeiconsIcon icon={Menu01Icon} size={24} strokeWidth={1.5} className="text-slate-700" />
            </button>
          </div>
        </nav>
        )}

        {/* Hero Section */}
        <main className="container mx-auto max-w-7xl px-6 relative z-10">
          <div className="pt-12 pb-8 flex justify-center items-start">
            <div className="max-w-2xl flex flex-col items-center gap-8">
              <div className="w-full flex flex-col items-center gap-6">
                <BlurReveal duration={1800} blur={12}>
                  <div className="inline-flex h-10 px-8 py-2 items-center gap-2 rounded-[10px] bg-[#F5F1FD] shadow-[0_-2px_4px_0_rgba(203,197,237,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset]">
                    <p className="text-sm font-medium text-foreground">{t('Hero.badge')}</p>
                  </div>
                </BlurReveal>
              
                <h1 className="text-5xl sm:text-6xl font-bold text-center text-slate-900 leading-tight">
                  {t.rich('Hero.title', {
                    minutes: (chunks) => <span className="text-[#6039B3] font-bold">{chunks}</span>
                  })}
              </h1>
              
                <p className="text-lg text-center text-slate-600 leading-7 max-w-xl">
                  {t('Hero.description')}
              </p>
              </div>
              
                <button 
                  onClick={() => setCurrentPage('upload')}
                className="inline-flex h-12 items-center justify-center gap-2 px-8 rounded-[10px] bg-[#6039B3] text-white font-semibold text-base hover:bg-[#5030A0] active:bg-[#4829A0] transition-all duration-200 shadow-[0_-2px_4px_0_rgba(0,0,0,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset] hover:shadow-[0_-2px_6px_0_rgba(0,0,0,0.35)_inset,0_2px_6px_0_rgba(255,255,255,0.35)_inset] transform hover:-translate-y-0.5"
                >
                {t('Hero.cta')}
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={1.5} />
                </button>
              
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm font-medium text-center" style={{ color: '#737373', fontFamily: 'Georgia, serif' }}>
                  {t('Creator.createdBy')}
                </p>
                <div className="relative h-8 w-auto">
                  <Image
                    src="/pictures/New+Logo+-+2022 (1).png"
                    alt="University of Chicago Law School"
                    width={140}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <p className="text-sm font-medium text-center" style={{ color: '#800000', fontFamily: 'Georgia, serif' }}>
                  {t('Creator.institution')}
                </p>
              </div>
            </div>
          </div>

          {/* Features Section - Three Features */}
          <div className="pt-8 pb-24 flex flex-col items-center gap-20 lg:gap-32">
            {/* Feature 1: AI Analysis - Image Right on Desktop */}
            <div className="container mx-auto max-w-6xl px-6">
              {/* Mobile Layout */}
              <div className="lg:hidden flex flex-col items-start justify-start gap-12 max-w-2xl mx-auto">
                <div className="flex flex-col items-start justify-start gap-10 w-full">
                  <div className="flex flex-col items-start justify-start gap-6 w-full">
                    <h1 className="text-3xl font-bold text-foreground">
                      {t('Features.aiAnalysis.title')}
                    </h1>
                    <p className="text-base text-muted-foreground">
                      {t('Features.aiAnalysis.description')}
                    </p>
                    </div>
                  
                  <div className="flex flex-col items-start justify-start gap-6 w-full">
                    <div className="flex flex-col items-start justify-start gap-4 w-full">
                      <h3 className="text-xl font-bold text-foreground">{t('Features.aiAnalysis.stat1Label')}</h3>
                      <p className="text-base text-muted-foreground">
                        {t('Features.aiAnalysis.stat1Description')}
                      </p>
                  </div>
                    
                    <div className="flex flex-col items-start justify-start gap-4 w-full">
                      <h3 className="text-xl font-bold text-foreground">{t('Features.aiAnalysis.stat2Label')}</h3>
                      <p className="text-base text-muted-foreground">
                        {t('Features.aiAnalysis.stat2Description')}
                      </p>
                </div>
                  </div>
                  
                  <div>
                    <button 
                      onClick={() => setCurrentPage('upload')}
                      className="inline-flex h-10 items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#6039B3] text-sm font-medium text-white hover:bg-[#5030A0] active:bg-[#4829A0] transition-all duration-200 shadow-[0_-2px_4px_0_rgba(0,0,0,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset] hover:shadow-[0_-2px_6px_0_rgba(0,0,0,0.35)_inset,0_2px_6px_0_rgba(255,255,255,0.35)_inset] transform hover:-translate-y-0.5"
                    >
                      {t('Features.aiAnalysis.cta')}
                    </button>
            </div>
          </div>

                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white border border-slate-200 shadow-xl">
                  <Image 
                    src="/pictures/lease.png" 
                    alt="Lease Analysis" 
                    width={1200} 
                    height={900}
                    className="w-full h-full object-cover"
                  />
            </div>
          </div>

              {/* Desktop Layout - Image Right */}
              <div className="hidden lg:flex justify-between items-center gap-20">
                <div className="flex flex-col gap-8 flex-1 max-w-xl">
                  <div className="flex flex-col gap-6">
                    <h1 className="text-4xl font-bold text-foreground">
                      {t('Features.aiAnalysis.title')}
                    </h1>
                    <p className="text-base text-muted-foreground">
                      {t('Features.aiAnalysis.description')}
                    </p>
      </div>
                  
                  <div className="flex gap-8">
                    <div className="flex flex-col gap-2 flex-1">
                      <h2 className="text-3xl font-bold text-foreground">{t('Features.aiAnalysis.stat1Label')}</h2>
                      <p className="text-base text-muted-foreground">
                        {t('Features.aiAnalysis.stat1Description')}
                      </p>
                </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <h2 className="text-3xl font-bold text-foreground">{t('Features.aiAnalysis.stat2Label')}</h2>
                      <p className="text-base text-muted-foreground">
                        {t('Features.aiAnalysis.stat2Description')}
                      </p>
              </div>
                  </div>
                  
                  <div>
              <button 
                      onClick={() => setCurrentPage('upload')}
                      className="inline-flex h-10 items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#6039B3] text-sm font-medium text-white hover:bg-[#5030A0] active:bg-[#4829A0] transition-all duration-200 shadow-[0_-2px_4px_0_rgba(0,0,0,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset] hover:shadow-[0_-2px_6px_0_rgba(0,0,0,0.35)_inset,0_2px_6px_0_rgba(255,255,255,0.35)_inset] transform hover:-translate-y-0.5"
              >
                      {t('Features.aiAnalysis.cta')}
              </button>
            </div>
          </div>
                
                <div className="flex-1 flex justify-center">
                  <div className="w-full max-w-2xl aspect-[4/3] rounded-xl overflow-hidden bg-white border border-slate-200 shadow-xl">
                    <Image 
                      src="/pictures/lease.png" 
                      alt="Lease Analysis" 
                      width={1200} 
                      height={900}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Know Your Rights - Image Left on Desktop */}
            <div className="container mx-auto max-w-6xl px-6">
              {/* Mobile Layout */}
              <div className="lg:hidden flex flex-col items-start justify-start gap-12 max-w-2xl mx-auto">
                <div className="flex flex-col items-start justify-start gap-10 w-full">
                  <div className="flex flex-col items-start justify-start gap-6 w-full">
                    <h1 className="text-3xl font-bold text-foreground">
                      {t('Features.stateLaws.title')}
                    </h1>
                    <p className="text-base text-muted-foreground">
                      {t('Features.stateLaws.description')}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-start justify-start gap-6 w-full">
                    <div className="flex flex-col items-start justify-start gap-4 w-full">
                      <h3 className="text-xl font-bold text-foreground">{t('Features.stateLaws.stat1Label')}</h3>
                      <p className="text-base text-muted-foreground">
                        {t('Features.stateLaws.stat1Description')}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-start justify-start gap-4 w-full">
                      <h3 className="text-xl font-bold text-foreground">{t('Features.stateLaws.stat2Label')}</h3>
                      <p className="text-base text-muted-foreground">
                        {t('Features.stateLaws.stat2Description')}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="inline-flex h-10 items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#F5F1FD] shadow-[0_-2px_4px_0_rgba(203,197,237,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset]">
                      <p className="text-sm font-medium text-[#800000]">{t('Features.stateLaws.status')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white border border-slate-200 shadow-xl">
                  <Image 
                    src="/pictures/laws.png" 
                    alt="Know Your Renter Rights" 
                    width={1200} 
                    height={900}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Desktop Layout - Image Left */}
              <div className="hidden lg:flex flex-row-reverse justify-between items-center gap-20">
                <div className="flex flex-col gap-8 flex-1 max-w-xl">
                  <div className="flex flex-col gap-6">
                    <h1 className="text-4xl font-bold text-foreground">
                      {t('Features.stateLaws.title')}
                    </h1>
                    <p className="text-base text-muted-foreground">
                      {t('Features.stateLaws.description')}
                    </p>
                  </div>
                  
                  <div className="flex gap-8">
                    <div className="flex flex-col gap-2 flex-1">
                      <h2 className="text-3xl font-bold text-foreground">{t('Features.stateLaws.stat1Label')}</h2>
                      <p className="text-base text-muted-foreground">
                        {t('Features.stateLaws.stat1Description')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <h2 className="text-3xl font-bold text-foreground">{t('Features.stateLaws.stat2Label')}</h2>
                      <p className="text-base text-muted-foreground">
                        {t('Features.stateLaws.stat2Description')}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="inline-flex h-10 items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#F5F1FD] shadow-[0_-2px_4px_0_rgba(203,197,237,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset]">
                      <p className="text-sm font-medium text-[#800000]">{t('Features.stateLaws.status')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 flex justify-center">
                  <div className="w-full max-w-2xl aspect-[4/3] rounded-xl overflow-hidden bg-white border border-slate-200 shadow-xl">
                    <Image 
                      src="/pictures/laws.png" 
                      alt="Know Your Renter Rights" 
                      width={1200} 
                      height={900}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Market Dashboard */}
            <div className="container mx-auto max-w-6xl px-6">
              {/* Mobile Layout */}
              <div className="lg:hidden flex flex-col items-start justify-start gap-12 max-w-2xl mx-auto">
                <div className="flex flex-col items-start justify-start gap-10 w-full">
                  <div className="flex flex-col items-start justify-start gap-6 w-full">
                    <h1 className="text-3xl font-bold text-foreground">
                      {t('Features.marketData.title')}
                    </h1>
                    <p className="text-base text-muted-foreground">
                      {t('Features.marketData.description')}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-start justify-start gap-6 w-full">
                    <div className="flex flex-col items-start justify-start gap-4 w-full">
                      <h3 className="text-xl font-bold text-foreground">{t('Features.marketData.stat1Label')}</h3>
                      <p className="text-base text-muted-foreground">
                        {t('Features.marketData.stat1Description')}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-start justify-start gap-4 w-full">
                      <h3 className="text-xl font-bold text-foreground">{t('Features.marketData.stat2Label')}</h3>
                      <p className="text-base text-muted-foreground">
                        {t('Features.marketData.stat2Description')}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="inline-flex h-10 items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#F5F1FD] shadow-[0_-2px_4px_0_rgba(203,197,237,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset]">
                      <p className="text-sm font-medium text-[#800000]">{t('Features.marketData.status')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white border border-slate-200 shadow-xl">
                  <Image 
                    src="/pictures/dashboard.png" 
                    alt="Market Dashboard" 
                    width={1200} 
                    height={900}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Desktop Layout - Image Right */}
              <div className="hidden lg:flex justify-between items-center gap-20">
                <div className="flex flex-col gap-8 flex-1 max-w-xl">
                  <div className="flex flex-col gap-6">
                    <h1 className="text-4xl font-bold text-foreground">
                      {t('Features.marketData.title')}
                    </h1>
                    <p className="text-base text-muted-foreground">
                      {t('Features.marketData.description')}
                    </p>
                  </div>
                  
                  <div className="flex gap-8">
                    <div className="flex flex-col gap-2 flex-1">
                      <h2 className="text-3xl font-bold text-foreground">{t('Features.marketData.stat1Label')}</h2>
                      <p className="text-base text-muted-foreground">
                        {t('Features.marketData.stat1Description')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <h2 className="text-3xl font-bold text-foreground">{t('Features.marketData.stat2Label')}</h2>
                      <p className="text-base text-muted-foreground">
                        {t('Features.marketData.stat2Description')}
                      </p>
            </div>
          </div>

                  <div>
                    <div className="inline-flex h-10 items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#F5F1FD] shadow-[0_-2px_4px_0_rgba(203,197,237,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset]">
                      <p className="text-sm font-medium text-[#800000]">{t('Features.marketData.status')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex justify-center">
                  <div className="w-full max-w-2xl aspect-[4/3] rounded-xl overflow-hidden bg-white border border-slate-200 shadow-xl">
                    <Image 
                      src="/pictures/dashboard.png" 
                      alt="Market Dashboard" 
                      width={1200} 
                      height={900}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer showDisclaimer />
        </>
      )}

      {currentPage === 'upload' && (
        <>
        {!isAnalyzing && (
          <Header showBackButton onBackClick={() => setCurrentPage('landing')} showLanguageToggle={false} />
        )}

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">{t('AnalyzePage.title')}</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {t('AnalyzePage.subtitle')}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <HugeiconsIcon icon={AlertCircleIcon} size={20} strokeWidth={1.5} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700">
                <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} />
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 lg:p-12 space-y-10">
            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <HugeiconsIcon icon={DocumentAttachmentIcon} size={28} strokeWidth={1.5} className="text-slate-700" />
                <label className="text-lg font-semibold text-slate-900">{t('AnalyzePage.documentUpload.title')}</label>
              </div>
              
              <input 
                type="file" 
                className="hidden" 
                id="file-upload" 
                accept=".pdf" 
                onChange={handleFileUpload} 
              />
              <label 
                htmlFor="file-upload"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`block border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 scale-105'
                    : uploadedFile 
                    ? 'border-slate-900 bg-slate-50/50' 
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
                }`}
              >
                <HugeiconsIcon 
                  icon={CloudUploadIcon} 
                  size={56} 
                  strokeWidth={1.5}
                  className={`mx-auto mb-4 transition-all duration-200 ${
                    isDragging 
                      ? 'text-blue-600 scale-110' 
                      : uploadedFile 
                        ? 'text-slate-900' 
                        : 'text-slate-400'
                  }`} 
                />
                <p className="text-lg font-medium text-slate-900 mb-2">
                  {isDragging 
                    ? t('AnalyzePage.documentUpload.dropHere')
                    : uploadedFile 
                      ? uploadedFile.name 
                      : t('AnalyzePage.documentUpload.dragDrop')}
                </p>
                <p className="text-sm text-slate-500">
                  {isDragging ? t('AnalyzePage.documentUpload.releaseToUpload') : t('AnalyzePage.documentUpload.maxSize')}
                </p>
              </label>
              
              {uploadedFile && uploadProgress < 100 && (
                <div className="mt-6">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-900 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-600 text-center mt-3">Uploading {uploadProgress}%</p>
                </div>
              )}
              
              {uploadedFile && uploadProgress === 100 && (
                <div className="mt-4 flex items-center justify-center gap-2 text-green-700">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} strokeWidth={1.5} />
                  <span className="text-sm font-medium">{t('AnalyzePage.documentUpload.uploadComplete')}</span>
                </div>
              )}
            </div>

            {/* User Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <HugeiconsIcon icon={UserListIcon} size={28} strokeWidth={1.5} className="text-slate-700" />
                <label className="text-lg font-semibold text-slate-900">{t('AnalyzePage.userInfo.title')}</label>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('AnalyzePage.userInfo.fullName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="userEmail" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('AnalyzePage.userInfo.email')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="userEmail"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <HugeiconsIcon icon={Location03Icon} size={28} strokeWidth={1.5} className="text-slate-700" />
                <label className="text-lg font-semibold text-slate-900">{t('AnalyzePage.userInfo.address')}</label>
              </div>
              
              <AddressAutocomplete value={address} onAddressSelect={setAddress} />
              
              {address && (
                <div className="mt-4 flex items-center justify-center gap-2 text-green-700">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} strokeWidth={1.5} />
                  <span className="text-sm font-medium">Address confirmed</span>
                </div>
              )}
            </div>

            {/* Analyze Button */}
            <div className="pt-4">
              <button
                onClick={handleAnalyze}
                disabled={!address || !uploadedFile || !userName || !userEmail || isAnalyzing || uploadProgress < 100}
                className="w-full inline-flex h-12 px-6 py-3 justify-center items-center gap-2 rounded-[10px] bg-[#6039B3] text-white font-semibold text-lg hover:bg-[#5030A0] active:bg-[#4829A0] disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_-2px_4px_0_rgba(0,0,0,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset] hover:shadow-[0_-2px_6px_0_rgba(0,0,0,0.35)_inset,0_2px_6px_0_rgba(255,255,255,0.35)_inset] disabled:shadow-none transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {isAnalyzing ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('AnalyzePage.analyzing')}
                  </>
                ) : (
                  t('AnalyzePage.cta')
                )}
              </button>
              
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-12 flex items-center justify-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <span className="text-sm font-medium text-slate-700">{t('AnalyzePage.steps.upload')}</span>
              </div>
              <div className="w-8 h-px bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  address ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  2
                </div>
                <span className="text-sm font-medium text-slate-700">{t('AnalyzePage.steps.address')}</span>
              </div>
              <div className="w-8 h-px bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="text-sm font-medium text-slate-500">{t('AnalyzePage.steps.results')}</span>
              </div>
            </div>
          </div>
        </main>
        
        <Footer showDisclaimer />
        </>
      )}

      {currentPage === 'results' && analysisResult && (
        <>
      
      {!isAnalyzing && (
        <Header showBackButton onBackClick={() => setCurrentPage('landing')} showLanguageToggle={false} />
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="mb-8 flex items-center justify-end gap-3">
          <button 
            onClick={async () => {
              if (analysisResult && address && userName && userEmail && !isExportingPDF) {
                setIsExportingPDF(true);
                try {
                  // Fetch comprehensive legal information for PDF
                  let comprehensiveLegalInfo = [];
                  try {
                    const response = await fetch('/api/comprehensive-legal-info', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        userAddress: address,
                        leaseContext: {
                          monthlyRent: analysisResult.summary.monthlyRent,
                          securityDeposit: analysisResult.summary.securityDeposit,
                          leaseStart: analysisResult.summary.leaseStart,
                          leaseEnd: analysisResult.summary.leaseEnd,
                        },
                        pdfUrl: analysisResult.pdfUrl 
                      }),
                    });
                    
                    if (response.ok) {
                      const data = await response.json();
                      comprehensiveLegalInfo = data.legalInfo || [];
                    }
                  } catch (error) {
                    console.error('Failed to fetch comprehensive legal info for PDF:', error);
                  }

                  const scenariosForPDF = scenarios?.scenarios?.map(s => ({
                    title: s.title,
                    advice: s.advice,
                    actionableSteps: s.actionableSteps || []
                  })) || [];
                  
                  await exportLeaseReportHTML({
                    summary: analysisResult.summary,
                    redFlags: analysisResult.redFlags,
                    rights: analysisResult.rights,
                    keyDates: analysisResult.keyDates,
                    scenarios: scenariosForPDF,
                    address,
                    userName,
                    userEmail,
                    comprehensiveLegalInfo,
                  });
                } catch (error) {
                  console.error('PDF export failed:', error);
                  alert('Failed to export PDF. Please try again.');
                } finally {
                  setIsExportingPDF(false);
                }
              }
            }}
            disabled={isExportingPDF || !analysisResult || !address || !userName || !userEmail || !scenarios || !scenarios.scenarios || scenarios.scenarios.length === 0}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 flex items-center gap-2 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
            title={
              !analysisResult ? "Analysis must be completed first" :
              !address ? "Address is required" :
              !userName ? "Name is required" :
              !userEmail ? "Email is required" :
              !scenarios || !scenarios.scenarios || scenarios.scenarios.length === 0 ? "Common Scenarios must be loaded before exporting PDF" : ""
            }
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={DownloadSquare02Icon} size={16} strokeWidth={1.5} />
                {t('ResultsPage.navigation.exportPDF')}
              </>
            )}
              </button>
              <button 
                onClick={() => { 
                  setCurrentPage('landing'); 
                  setAnalysisResult(null); 
                  setUploadedFile(null);
                  setAddress('');
                  setUploadProgress(0);
                  setError(null);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all duration-200 flex items-center gap-2"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={1.5} />
                {t('ResultsPage.navigation.newAnalysis')}
              </button>
            </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'analysis'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HugeiconsIcon icon={DocumentValidationIcon} size={18} strokeWidth={1.5} />
              {t('Tabs.analysisResults')}
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'chat'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HugeiconsIcon icon={Comment01Icon} size={18} strokeWidth={1.5} />
              {t('Tabs.chatWithLease')}
            </button>
            <button
              onClick={() => setActiveTab('letters')}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'letters'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HugeiconsIcon icon={QuillWrite02Icon} size={18} strokeWidth={1.5} />
              {t('Tabs.legalLetters')}
            </button>
          </div>
        </div>

        {/* Analysis Tab Content */}
        <div style={{ display: activeTab === 'analysis' ? 'block' : 'none' }}>
          <>
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">{t('ResultsPage.header.title')}</h1>
              <p className="text-xl text-slate-600">{address}</p>
            </div>
            {/* Property Street View */}
            {address && (
              <div className="mb-12">
                <PropertyStreetView address={address} title={t('ResultsPage.propertyInfo.streetView')} />
              </div>
            )}

            {/* Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-sm font-medium text-slate-500 mb-2 flex items-center">
              {t('ResultsPage.propertyInfo.monthlyRent')}
              {analysisResult.summary.sources?.monthlyRent && (
                <SourceCitation 
                  sourceText={analysisResult.summary.sources.monthlyRent} 
                  label="Monthly Rent Source"
                  pageNumber={analysisResult.summary.pageNumbers?.monthlyRent}
                  pdfUrl={analysisResult.pdfUrl}
                  searchText={analysisResult.summary.sources.monthlyRent}
                />
              )}
            </div>
            <div className={`text-3xl font-bold ${analysisResult.summary.monthlyRent && analysisResult.summary.monthlyRent !== '$0' ? 'text-slate-900' : 'text-slate-400'}`}>
              {analysisResult.summary.monthlyRent && analysisResult.summary.monthlyRent !== '$0' 
                ? analysisResult.summary.monthlyRent 
                : t('ResultsPage.propertyInfo.notSpecified')}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-sm font-medium text-slate-500 mb-2 flex items-center">
              {t('ResultsPage.propertyInfo.securityDeposit')}
              {analysisResult.summary.sources?.securityDeposit && (
                <SourceCitation 
                  sourceText={analysisResult.summary.sources.securityDeposit} 
                  label="Security Deposit Source"
                  pageNumber={analysisResult.summary.pageNumbers?.securityDeposit}
                  pdfUrl={analysisResult.pdfUrl}
                  searchText={analysisResult.summary.sources.securityDeposit}
                />
              )}
            </div>
            <div className={`text-3xl font-bold ${analysisResult.summary.securityDeposit && analysisResult.summary.securityDeposit !== '$0' ? 'text-slate-900' : 'text-slate-400'}`}>
              {analysisResult.summary.securityDeposit && analysisResult.summary.securityDeposit !== '$0' 
                ? analysisResult.summary.securityDeposit 
                : t('ResultsPage.propertyInfo.notSpecified')}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-sm font-medium text-slate-500 mb-2 flex items-center">
              {t('ResultsPage.propertyInfo.leaseStart')}
              {analysisResult.summary.sources?.leaseStart && (
                <SourceCitation 
                  sourceText={analysisResult.summary.sources.leaseStart} 
                  label="Lease Start Date Source"
                  pageNumber={analysisResult.summary.pageNumbers?.leaseStart}
                  pdfUrl={analysisResult.pdfUrl}
                  searchText={analysisResult.summary.sources.leaseStart}
                />
              )}
            </div>
            <div className={`text-2xl font-bold ${analysisResult.summary.leaseStart ? 'text-slate-900' : 'text-slate-400'}`}>
              {analysisResult.summary.leaseStart || t('ResultsPage.propertyInfo.notSpecified')}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-sm font-medium text-slate-500 mb-2 flex items-center">
              {t('ResultsPage.propertyInfo.leaseEnd')}
              {analysisResult.summary.sources?.leaseEnd && (
                <SourceCitation 
                  sourceText={analysisResult.summary.sources.leaseEnd} 
                  label="Lease End Date Source"
                  pageNumber={analysisResult.summary.pageNumbers?.leaseEnd}
                  pdfUrl={analysisResult.pdfUrl}
                  searchText={analysisResult.summary.sources.leaseEnd}
                />
              )}
            </div>
            <div className={`text-2xl font-bold ${analysisResult.summary.leaseEnd ? 'text-slate-900' : 'text-slate-400'}`}>
              {analysisResult.summary.leaseEnd || t('ResultsPage.propertyInfo.notSpecified')}
            </div>
          </div>
        </div>

        {/* Red Flags Section - Always Show */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 mb-8">
          <div className="border-b border-slate-200/60 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HugeiconsIcon icon={AlertSquareIcon} size={32} strokeWidth={1.5} className={analysisResult.redFlags.length > 0 ? "text-red-600" : "text-green-600"} />
                <h2 className="text-xl font-semibold text-slate-900">{t('ResultsPage.propertyInfo.redFlags')}</h2>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                analysisResult.redFlags.length > 0 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {analysisResult.redFlags.length > 0 
                  ? `${analysisResult.redFlags.length} ${t('ResultsPage.propertyInfo.detected')}`
                  : t('ResultsPage.redFlags.noneFound')
                }
              </span>
            </div>
          </div>
          {analysisResult.redFlags.length > 0 ? (
            <div className="divide-y divide-slate-200/60">
              {analysisResult.redFlags.map((flag, i) => (
                <div key={i} className="px-6 py-5 hover:bg-slate-50/50 transition-colors duration-200">
                  <div className="flex items-start gap-4">
                    <HugeiconsIcon icon={CircleIcon} size={12} strokeWidth={2} className="text-red-600 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{flag.issue}</h3>
                        <SourceCitation 
                          sourceText={flag.source} 
                          label={`${t('SourceCitation.redFlag')}: ${flag.issue}`}
                          pageNumber={flag.page_number}
                          pdfUrl={analysisResult.pdfUrl}
                          searchText={flag.source}
                        />
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full uppercase ${
                          flag.severity === 'high' ? 'bg-red-100 text-red-700' : 
                          flag.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {t(`ResultsPage.severity.${flag.severity}`)}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{flag.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} strokeWidth={2} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{t('ResultsPage.redFlags.noneFoundTitle')}</h3>
                <p className="text-slate-600 max-w-md">{t('ResultsPage.redFlags.noneFoundDescription')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Comprehensive Legal Information Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-8">
          <ComprehensiveLegalTable 
            userAddress={address}
            pdfUrl={analysisResult.pdfUrl}
            leaseContext={{
              monthlyRent: analysisResult.summary.monthlyRent,
              securityDeposit: analysisResult.summary.securityDeposit,
              leaseStart: analysisResult.summary.leaseStart,
              leaseEnd: analysisResult.summary.leaseEnd,
            }}
          />
        </div>

        {/* Enhanced Common Scenarios */}
        <div className="mb-8">
          {isScenariosLoading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 px-6 py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"
                />
                <p className="text-slate-600 font-medium">Loading Common Scenarios...</p>
                <p className="text-sm text-slate-500">Analyzing your lease for specific situations...</p>
              </div>
            </div>
          ) : scenarios && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
              <div className="border-b border-slate-200/60 px-6 py-5">
                <div className="flex items-center gap-3">
                  <HugeiconsIcon icon={MapsSearchIcon} size={32} strokeWidth={1.5} className="text-purple-600" />
                  <h2 className="text-xl font-semibold text-slate-900">{t('ResultsPage.scenarios.title')}</h2>
                </div>
              </div>
              <div className="divide-y divide-slate-200/60">
                {scenarios.scenarios.map((scenario, i) => (
                  <div key={i} className="px-6 py-5 hover:bg-slate-50/50 transition-colors duration-200">
                    {/* Simple Header */}
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-slate-900">{scenario.title}</h3>
                  </div>
                    
                    {/* Simple Main Advice - Big and Clear */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border border-blue-200">
                      <p className="text-slate-600 leading-relaxed">
                        {scenario.advice}
                      </p>
                      {/* Source Attribution for Advice - Always show if available */}
                      {scenario.leaseRelevantText && scenario.leaseRelevantText.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs text-slate-600 font-medium">{t('ResultsPage.scenarios.source')}</span>
                          <SourceCitation
                            sourceText={scenario.leaseRelevantText}
                            pageNumber={scenario.pageNumber}
                            pdfUrl={analysisResult?.pdfUrl}
                            label="From your lease"
                          />
            </div>
          )}
        </div>

                    {/* Simple Action Steps - Always Show */}
                    {scenario.actionableSteps && scenario.actionableSteps.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} strokeWidth={1.5} className="text-green-600" />
                          <span className="text-sm font-semibold text-green-700">
                            {t('ResultsPage.scenarios.whatToDo')}
                          </span>
                        </div>
                        <ol className="space-y-2">
                          {scenario.actionableSteps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-semibold">
                                {stepIndex + 1}
                              </span>
                              <div className="flex-1">
                                <span className="text-sm text-green-900 leading-relaxed">{step}</span>
              </div>
                            </li>
                          ))}
                        </ol>
            </div>
                    )}
              </div>
                ))}
              </div>
            </div>
        )}
        </div>
          </>
        </div>

        {/* Chat Tab Content */}
        <div style={{ display: activeTab === 'chat' ? 'block' : 'none' }}>
          <>
            {leaseDataId ? (
              <div>
                <LeaseChat 
                  leaseDataId={leaseDataId}
                  userEmail={userEmail}
                  pdfUrl={analysisResult.pdfUrl}
                  analysisResult={analysisResult}
                />
              </div>
            ) : (
              <div className="max-w-2xl mx-auto mt-12">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <HugeiconsIcon icon={Alert02Icon} size={40} className="text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">
                    Chat Not Available
                  </h3>
                  <p className="text-amber-800">
                    This is an old analysis from before the chat feature was added. Please analyze a new lease to use the chat feature.
                  </p>
                </div>
              </div>
            )}
          </>
        </div>

        {/* Template Letters Tab Content */}
        <div style={{ display: activeTab === 'letters' ? 'block' : 'none' }}>
          <>
            {leaseDataId ? (
              <div>
                <LegalLetters 
                  leaseDataId={leaseDataId}
                  userEmail={userEmail}
                  userName={userName}
                  address={address}
                  analysisResult={analysisResult}
                />
              </div>
            ) : (
              <div className="max-w-2xl mx-auto mt-12">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <HugeiconsIcon icon={Alert02Icon} size={40} className="text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">
                    Template Letters Not Available
                  </h3>
                  <p className="text-amber-800">
                    This is an old analysis from before the template letters feature was added. Please analyze a new lease to use this feature.
                  </p>
                </div>
              </div>
            )}
          </>
        </div>

      </main>
      
      <Footer showDisclaimer />
        </>
        )}
    </div>
  );
}