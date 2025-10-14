'use client';

import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, FileText, Calendar, Download, Plus, X, BarChart3, ArrowRight, Menu, Loader2 } from 'lucide-react';
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
import { exportLeaseReportHTML } from '@/lib/export-pdf-html';
import Image from 'next/image';

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
  scenarios: Array<{ title: string; advice: string }>;
}

export default function LeaseWiseApp() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [address, setAddress] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [scenarios, setScenarios] = useState<Scenarios | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);

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
      setAnalysisStage('Uploading your lease document...');
      setAnalysisProgress(5);
      addLog('Uploading lease document to secure storage...');
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
      addLog('Upload complete!');
      setAnalysisStage('Processing document...');

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
      setAnalysisStage('Extracting text from your lease...');
      setAnalysisProgress(30);
      addLog('Extracting text from PDF document...');
      
      setTimeout(() => addLog('Initializing RAG system for accurate analysis...'), 1000);
      setTimeout(() => addLog('Analyzing lease clauses with AI...'), 3000);
      setTimeout(() => addLog('Identifying potential red flags...'), 6000);
      setTimeout(() => addLog('Extracting tenant rights and obligations...'), 9000);
      setTimeout(() => addLog('Structuring lease data...'), 12000);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout
      
      // Simulate progress during API call
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev < 85) return prev + 1;
          return prev;
        });
      }, 800); // Update every 800ms

      // Update stages during analysis
      setTimeout(() => setAnalysisStage('Analyzing lease terms and conditions...'), 3000);
      setTimeout(() => setAnalysisStage('Detecting potential red flags...'), 10000);
      setTimeout(() => setAnalysisStage('Identifying your tenant rights...'), 20000);
      setTimeout(() => setAnalysisStage('Extracting important dates...'), 30000);
      setTimeout(() => setAnalysisStage('Finalizing comprehensive analysis...'), 45000);
      
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
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timed out. Please try with a smaller file or configure Supabase for better performance.');
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
        setAnalysisResult(data.analysis);
        setScenarios(data.scenarios);
        setCurrentPage('results');
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
        {/* Navbar */}
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
              <button 
                onClick={() => setCurrentPage('upload')}
                className="inline-flex h-9 items-center justify-center gap-2 px-4 rounded-[10px] bg-[#6039B3] text-white font-semibold text-sm hover:bg-[#5030A0] active:bg-[#4829A0] transition-all duration-200 shadow-[0_-2px_4px_0_rgba(0,0,0,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset] hover:shadow-[0_-2px_6px_0_rgba(0,0,0,0.35)_inset,0_2px_6px_0_rgba(255,255,255,0.35)_inset] transform hover:-translate-y-0.5"
              >
                Get Started
              </button>
            </div>

            <button className="md:hidden p-2">
              <Menu className="h-6 w-6 text-slate-700" />
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="container mx-auto max-w-7xl px-6 relative z-10">
          <div className="pt-12 pb-8 flex justify-center items-start">
            <div className="max-w-2xl flex flex-col items-center gap-8">
              <div className="w-full flex flex-col items-center gap-6">
                <div className="inline-flex h-10 px-8 py-2 items-center gap-2 rounded-[10px] bg-[#F5F1FD] shadow-[0_-2px_4px_0_rgba(203,197,237,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset]">
                  <p className="text-sm font-medium text-foreground">AI-Powered Lease Analysis</p>
              </div>
              
                <h1 className="text-5xl sm:text-6xl font-bold text-center text-slate-900 leading-tight">
                  Understand your lease in <span className="text-[#6039B3]">minutes</span>
              </h1>
              
                <p className="text-lg text-center text-slate-600 leading-7 max-w-xl">
                  Upload your lease PDF and get instant AI analysis of terms, rights, and red flags. Make informed rental decisions with confidence and clarity.
              </p>
              </div>
              
                <button 
                  onClick={() => setCurrentPage('upload')}
                className="inline-flex h-12 items-center justify-center gap-2 px-8 rounded-[10px] bg-[#6039B3] text-white font-semibold text-base hover:bg-[#5030A0] active:bg-[#4829A0] transition-all duration-200 shadow-[0_-2px_4px_0_rgba(0,0,0,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset] hover:shadow-[0_-2px_6px_0_rgba(0,0,0,0.35)_inset,0_2px_6px_0_rgba(255,255,255,0.35)_inset] transform hover:-translate-y-0.5"
                >
                Analyze your lease
                <ArrowRight className="w-4 h-4" />
                </button>
              
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm font-medium text-center" style={{ color: '#737373', fontFamily: 'Georgia, serif' }}>
                  Created by
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
                  University of Chicago Law School • AI Lab
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
                      Get instant AI analysis of your lease
                    </h1>
                    <p className="text-base text-muted-foreground">
                      Upload your lease PDF and receive comprehensive analysis in minutes. Our AI detects red flags, explains complex terms, identifies important dates, and provides actionable insights about your rental agreement.
                    </p>
                    </div>
                  
                  <div className="flex flex-col items-start justify-start gap-6 w-full">
                    <div className="flex flex-col items-start justify-start gap-4 w-full">
                      <h3 className="text-xl font-bold text-foreground">Under 2 min</h3>
                      <p className="text-base text-muted-foreground">
                        Fast analysis that examines every clause, identifies potential issues, and explains what matters most in plain English.
                      </p>
                  </div>
                    
                    <div className="flex flex-col items-start justify-start gap-4 w-full">
                      <h3 className="text-xl font-bold text-foreground">Free</h3>
                      <p className="text-base text-muted-foreground">
                        No signup required. Upload your lease and get instant analysis with detailed breakdowns and personalized insights.
                      </p>
                </div>
                  </div>
                  
                  <div>
                    <button 
                      onClick={() => setCurrentPage('upload')}
                      className="inline-flex h-10 items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#6039B3] text-sm font-medium text-white hover:bg-[#5030A0] active:bg-[#4829A0] transition-all duration-200 shadow-[0_-2px_4px_0_rgba(0,0,0,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset] hover:shadow-[0_-2px_6px_0_rgba(0,0,0,0.35)_inset,0_2px_6px_0_rgba(255,255,255,0.35)_inset] transform hover:-translate-y-0.5"
                    >
                      Analyze your lease now
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
                      Get instant AI analysis of your lease
                    </h1>
                    <p className="text-base text-muted-foreground">
                      Upload your lease PDF and receive comprehensive analysis in minutes. Our AI detects red flags, explains complex terms, identifies important dates, and provides actionable insights about your rental agreement.
                    </p>
      </div>
                  
                  <div className="flex gap-8">
                    <div className="flex flex-col gap-2 flex-1">
                      <h2 className="text-3xl font-bold text-foreground">Under 2 min</h2>
                      <p className="text-base text-muted-foreground">
                        Fast analysis that examines every clause, identifies potential issues, and explains what matters most in plain English.
                      </p>
                </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <h2 className="text-3xl font-bold text-foreground">Free</h2>
                      <p className="text-base text-muted-foreground">
                        No signup required. Upload your lease and get instant analysis with detailed breakdowns and personalized insights.
                      </p>
              </div>
                  </div>
                  
                  <div>
              <button 
                      onClick={() => setCurrentPage('upload')}
                      className="inline-flex h-10 items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#6039B3] text-sm font-medium text-white hover:bg-[#5030A0] active:bg-[#4829A0] transition-all duration-200 shadow-[0_-2px_4px_0_rgba(0,0,0,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset] hover:shadow-[0_-2px_6px_0_rgba(0,0,0,0.35)_inset,0_2px_6px_0_rgba(255,255,255,0.35)_inset] transform hover:-translate-y-0.5"
              >
                      Analyze your lease now
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
                      Understand your state's landlord-renter laws
                    </h1>
                    <p className="text-base text-muted-foreground">
                      Access comprehensive information about your rights as a renter. Learn about security deposits, lease terminations, maintenance obligations, and legal protections specific to your state and city.
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-start justify-start gap-6 w-full">
                    <div className="flex flex-col items-start justify-start gap-4 w-full">
                      <h3 className="text-xl font-bold text-foreground">50 States</h3>
                      <p className="text-base text-muted-foreground">
                        Complete coverage of landlord-renter laws across all US states with city-specific regulations and requirements.
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-start justify-start gap-4 w-full">
                      <h3 className="text-xl font-bold text-foreground">Updated</h3>
                      <p className="text-base text-muted-foreground">
                        Current legal information with sources cited, so you always have accurate and reliable renter law guidance.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="inline-flex h-10 items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#F5F1FD] shadow-[0_-2px_4px_0_rgba(203,197,237,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset]">
                      <p className="text-sm font-medium text-[#800000]">Coming Soon</p>
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
                      Understand your state's landlord-renter laws
                    </h1>
                    <p className="text-base text-muted-foreground">
                      Access comprehensive information about your rights as a renter. Learn about security deposits, lease terminations, maintenance obligations, and legal protections specific to your state and city.
                    </p>
                  </div>
                  
                  <div className="flex gap-8">
                    <div className="flex flex-col gap-2 flex-1">
                      <h2 className="text-3xl font-bold text-foreground">50 States</h2>
                      <p className="text-base text-muted-foreground">
                        Complete coverage of landlord-renter laws across all US states with city-specific regulations and requirements.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <h2 className="text-3xl font-bold text-foreground">Updated</h2>
                      <p className="text-base text-muted-foreground">
                        Current legal information with sources cited, so you always have accurate and reliable renter law guidance.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="inline-flex h-10 items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#F5F1FD] shadow-[0_-2px_4px_0_rgba(203,197,237,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset]">
                      <p className="text-sm font-medium text-[#800000]">Coming Soon</p>
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
                      Compare your rental data with market trends
                    </h1>
                    <p className="text-base text-muted-foreground">
                      See how your lease compares to thousands of rentals in your area. Get instant insights on market rates, price percentiles, and whether you're getting a fair deal on your rental agreement.
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-start justify-start gap-6 w-full">
                    <div className="flex flex-col items-start justify-start gap-4 w-full">
                      <h3 className="text-xl font-bold text-foreground">3,200+</h3>
                      <p className="text-base text-muted-foreground">
                        Active leases analyzed to provide you with accurate market comparisons and pricing insights for your area.
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-start justify-start gap-4 w-full">
                      <h3 className="text-xl font-bold text-foreground">Real-time</h3>
                      <p className="text-base text-muted-foreground">
                        Up-to-date market data helps you understand if your rent is competitive and make informed decisions.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="inline-flex h-10 items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#F5F1FD] shadow-[0_-2px_4px_0_rgba(203,197,237,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset]">
                      <p className="text-sm font-medium text-[#800000]">Coming Soon</p>
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
                      Compare your rental data with market trends
                    </h1>
                    <p className="text-base text-muted-foreground">
                      See how your lease compares to thousands of rentals in your area. Get instant insights on market rates, price percentiles, and whether you're getting a fair deal on your rental agreement.
                    </p>
                  </div>
                  
                  <div className="flex gap-8">
                    <div className="flex flex-col gap-2 flex-1">
                      <h2 className="text-3xl font-bold text-foreground">3,200+</h2>
                      <p className="text-base text-muted-foreground">
                        Active leases analyzed to provide you with accurate market comparisons and pricing insights for your area.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <h2 className="text-3xl font-bold text-foreground">Real-time</h2>
                      <p className="text-base text-muted-foreground">
                        Up-to-date market data helps you understand if your rent is competitive and make informed decisions.
                      </p>
            </div>
          </div>

                  <div>
                    <div className="inline-flex h-10 items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#F5F1FD] shadow-[0_-2px_4px_0_rgba(203,197,237,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset]">
                      <p className="text-sm font-medium text-[#800000]">Coming Soon</p>
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
        <Header showBackButton onBackClick={() => setCurrentPage('landing')} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">Analyze your lease</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Upload your lease PDF and enter your property address to get instant AI-powered analysis
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 lg:p-12 space-y-10">
            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg">
                  <FileText className="h-5 w-5 text-slate-700" />
                </div>
                <label className="text-lg font-semibold text-slate-900">Lease Document</label>
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
                <Upload className={`h-12 w-12 mx-auto mb-4 transition-all duration-200 ${
                  isDragging 
                    ? 'text-blue-600 scale-110' 
                    : uploadedFile 
                      ? 'text-slate-900' 
                      : 'text-slate-400'
                }`} />
                <p className="text-lg font-medium text-slate-900 mb-2">
                  {isDragging 
                    ? 'Drop your PDF here' 
                    : uploadedFile 
                      ? uploadedFile.name 
                      : 'Click to upload or drag & drop PDF'}
                </p>
                <p className="text-sm text-slate-500">
                  {isDragging ? 'Release to upload' : 'Maximum file size: 50MB (Supabase upload)'}
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
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Upload complete</span>
                </div>
              )}
            </div>

            {/* User Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg">
                  <FileText className="h-5 w-5 text-slate-700" />
                </div>
                <label className="text-lg font-semibold text-slate-900">Your Information</label>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
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
                    Email Address <span className="text-red-500">*</span>
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
                <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-slate-700" />
                </div>
                <label className="text-lg font-semibold text-slate-900">Property Address</label>
              </div>
              
              <AddressAutocomplete value={address} onAddressSelect={setAddress} />
              
              {address && (
                <div className="mt-4 flex items-center justify-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
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
                    Analyzing...
                  </>
                ) : (
                  'Analyze Lease'
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
                <span className="text-sm font-medium text-slate-700">Upload</span>
              </div>
              <div className="w-8 h-px bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  address ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  2
                </div>
                <span className="text-sm font-medium text-slate-700">Address</span>
              </div>
              <div className="w-8 h-px bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="text-sm font-medium text-slate-500">Results</span>
              </div>
            </div>
          </div>
        </main>
        
        <Footer showDisclaimer />
        </>
      )}

      {currentPage === 'results' && analysisResult && (
        <>
      
      <Header showBackButton onBackClick={() => setCurrentPage('landing')} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="mb-8 flex items-center justify-end gap-3">
          <button 
            onClick={async () => {
              if (analysisResult && !isExportingPDF) {
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

                  await exportLeaseReportHTML({
                    summary: analysisResult.summary,
                    redFlags: analysisResult.redFlags,
                    rights: analysisResult.rights,
                    keyDates: analysisResult.keyDates,
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
            disabled={isExportingPDF}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 flex items-center gap-2 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export PDF
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
                <Plus className="h-4 w-4" />
                New Analysis
              </button>
            </div>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">Lease Analysis Complete</h1>
          <p className="text-xl text-slate-600">{address}</p>
        </div>

        {/* Property Street View */}
        {address && (
          <div className="mb-12">
            <PropertyStreetView address={address} />
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-sm font-medium text-slate-500 mb-2 flex items-center">
              Monthly Rent
              <SourceCitation 
                sourceText={analysisResult.summary.sources?.monthlyRent} 
                label="Monthly Rent Source"
                pageNumber={analysisResult.summary.pageNumbers?.monthlyRent}
                pdfUrl={analysisResult.pdfUrl}
                searchText={analysisResult.summary.sources?.monthlyRent}
              />
            </div>
            <div className="text-3xl font-bold text-slate-900">{analysisResult.summary.monthlyRent}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-sm font-medium text-slate-500 mb-2 flex items-center">
              Security Deposit
              <SourceCitation 
                sourceText={analysisResult.summary.sources?.securityDeposit} 
                label="Security Deposit Source"
                pageNumber={analysisResult.summary.pageNumbers?.securityDeposit}
                pdfUrl={analysisResult.pdfUrl}
                searchText={analysisResult.summary.sources?.securityDeposit}
              />
            </div>
            <div className="text-3xl font-bold text-slate-900">{analysisResult.summary.securityDeposit}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-sm font-medium text-slate-500 mb-2 flex items-center">
              Lease Start
              <SourceCitation 
                sourceText={analysisResult.summary.sources?.leaseStart} 
                label="Lease Start Date Source"
                pageNumber={analysisResult.summary.pageNumbers?.leaseStart}
                pdfUrl={analysisResult.pdfUrl}
                searchText={analysisResult.summary.sources?.leaseStart}
              />
            </div>
            <div className="text-2xl font-bold text-slate-900">{analysisResult.summary.leaseStart}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-sm font-medium text-slate-500 mb-2 flex items-center">
              Lease End
              <SourceCitation 
                sourceText={analysisResult.summary.sources?.leaseEnd} 
                label="Lease End Date Source"
                pageNumber={analysisResult.summary.pageNumbers?.leaseEnd}
                pdfUrl={analysisResult.pdfUrl}
                searchText={analysisResult.summary.sources?.leaseEnd}
              />
            </div>
            <div className="text-2xl font-bold text-slate-900">{analysisResult.summary.leaseEnd}</div>
          </div>
        </div>

        {/* Red Flags Section */}
        {analysisResult.redFlags.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 mb-8">
            <div className="border-b border-slate-200/60 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Red Flags</h2>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                  {analysisResult.redFlags.length} detected
                </span>
              </div>
            </div>
            <div className="divide-y divide-slate-200/60">
              {analysisResult.redFlags.map((flag, i) => (
                <div key={i} className="px-6 py-5 hover:bg-slate-50/50 transition-colors duration-200">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{flag.issue}</h3>
                        <SourceCitation 
                          sourceText={flag.source} 
                          label={`Red Flag: ${flag.issue}`}
                          pageNumber={flag.page_number}
                          pdfUrl={analysisResult.pdfUrl}
                          searchText={flag.source}
                        />
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full uppercase ${
                          flag.severity === 'high' ? 'bg-red-100 text-red-700' : 
                          flag.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {flag.severity}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{flag.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Key Dates */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
            <div className="border-b border-slate-200/60 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Key Dates</h2>
              </div>
            </div>
            <div className="divide-y divide-slate-200/60">
              {analysisResult.keyDates.map((date, i) => (
                <div key={i} className="px-6 py-5 hover:bg-slate-50/50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-slate-400" />
                      <div>
                        <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{date.event}</p>
                          <SourceCitation 
                            sourceText={date.source} 
                            label={`Key Date: ${date.event}`}
                            pageNumber={date.page_number}
                            pdfUrl={analysisResult.pdfUrl}
                            searchText={date.source}
                          />
                        </div>
                        <p className="text-sm text-slate-600">{date.description}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-900 bg-slate-100 px-3 py-1 rounded-full">
                      {date.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Common Scenarios */}
          {scenarios && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
              <div className="border-b border-slate-200/60 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Common Scenarios</h2>
                </div>
              </div>
              <div className="divide-y divide-slate-200/60">
                {scenarios.scenarios.map((scenario, i) => (
                  <div key={i} className="px-6 py-5 hover:bg-slate-50/50 transition-colors duration-200">
                    <h3 className="font-semibold text-slate-900 mb-2">{scenario.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{scenario.advice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </main>
      
      <Footer showDisclaimer />
        </>
      )}
    </div>
  );
}