'use client';

import { useState } from 'react';
import { Upload, Shield, AlertCircle, CheckCircle, FileText, Calendar, Download, Plus, X, BarChart3 } from 'lucide-react';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { SmartExtractionIcon, RedFlagDetectionIcon, KnowYourRightsIcon } from './AnimatedIcons';

type Page = 'landing' | 'upload' | 'results';

interface AnalysisResult {
  summary: { monthlyRent: string; securityDeposit: string; leaseStart: string; leaseEnd: string; noticePeriod: string };
  redFlags: Array<{ issue: string; severity: string; explanation: string }>;
  rights: Array<{ right: string; law: string }>;
  marketComparison: { rentPercentile: number; depositStatus: string; rentAnalysis: string };
  keyDates: Array<{ event: string; date: string; description: string }>;
}

interface Scenarios {
  scenarios: Array<{ title: string; advice: string }>;
}

export default function LeaseWiseApp() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [address, setAddress] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [scenarios, setScenarios] = useState<Scenarios | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size limits
    const maxDirectSize = 4 * 1024 * 1024; // 4MB for direct API upload
    const maxSupabaseSize = 50 * 1024 * 1024; // 50MB for direct Supabase upload
    
    // Check if Supabase is configured
    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (hasSupabase && file.size > maxSupabaseSize) {
      setError('File too large. Maximum size is 50MB.');
      return;
    } else if (!hasSupabase && file.size > maxDirectSize) {
      setError('File too large. Maximum size is 4MB without Supabase configuration.');
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

  const handleAnalyze = async () => {
    if (!address || !uploadedFile) {
      setError('Please upload a lease and enter your address');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);

    try {
      let response;
      
      // Check if we have Supabase configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured, falling back to direct API upload');
        // Fallback to direct API upload for small files
        if (uploadedFile.size > 4 * 1024 * 1024) { // 4MB
          throw new Error('File too large for direct upload. Please configure Supabase for files over 4MB.');
        }
        
        // Use direct API upload for small files
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('address', address);
        
        response = await fetch('/api/analyze-lease', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (data.success) {
          setAnalysisResult(data.analysis);
          setScenarios(data.scenarios);
          setCurrentPage('results');
        } else {
          setError(data.error || 'Failed to analyze lease. Please try again.');
        }
        return;
      }

      // Upload directly to Supabase from client (bypasses Vercel payload limits)
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
        
        // If Supabase upload fails, try direct API upload for small files
        if (uploadedFile.size <= 4 * 1024 * 1024) { // 4MB
          console.warn('Supabase upload failed, falling back to direct API upload');
          const formData = new FormData();
          formData.append('file', uploadedFile);
          formData.append('address', address);
          
          response = await fetch('/api/analyze-lease', {
            method: 'POST',
            body: formData,
          });
          
          const data = await response.json();
          
          if (data.success) {
            setAnalysisResult(data.analysis);
            setScenarios(data.scenarios);
            setCurrentPage('results');
          } else {
            setError(data.error || 'Failed to analyze lease. Please try again.');
          }
          return;
        } else {
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }
      }

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
      response = await fetch('/api/analyze-lease', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfUrl: urlData.publicUrl,
          address
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAnalysisResult(data.analysis);
        setScenarios(data.scenarios);
        setCurrentPage('results');
        
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
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (currentPage === 'landing') {
    return (
      <div className="min-h-screen gradient-bg-modern">
        {/* Navigation */}
        <nav className="border-b border-slate-200/60 backdrop-blur-sm bg-white/80 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-slate-900 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-slate-900">LeaseWise</span>
              </div>
              <div className="flex items-center gap-3">
                <a 
                  href="/dashboard"
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </a>
                <button 
                  onClick={() => setCurrentPage('upload')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="pt-20 pb-16 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-medium mb-8">
                <CheckCircle className="h-4 w-4" />
                AI-Powered Lease Analysis
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-8 leading-[1.1] tracking-tight">
                Understand your lease in 
                <span className="text-slate-600"> minutes</span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Upload your lease PDF and get instant AI analysis of terms, rights, and important dates. 
                Make informed decisions with clarity.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={() => setCurrentPage('upload')}
                  className="px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold text-lg hover:bg-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Analyze Your Lease
                </button>
                <div className="text-sm text-slate-500">
                  Free • No signup required • Secure
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="py-20">
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {[
                { 
                  icon: SmartExtractionIcon, 
                  title: 'Smart Extraction', 
                  desc: 'AI extracts key terms, dates, and clauses automatically from your lease document.' 
                },
                { 
                  icon: RedFlagDetectionIcon, 
                  title: 'Red Flag Detection', 
                  desc: 'Instantly identifies problematic clauses and terms that might not be in your favor.' 
                },
                { 
                  icon: KnowYourRightsIcon, 
                  title: 'Know Your Rights', 
                  desc: 'Get location-specific tenant rights information based on your property address.' 
                }
              ].map((item, i) => (
                <div key={i} className="group">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 hover:shadow-lg hover:border-slate-300/60 transition-all duration-300 h-full">
                    <div className="flex items-center justify-center w-24 h-24 bg-slate-100 rounded-xl mb-6 group-hover:bg-slate-900 transition-colors duration-200">
                      <item.icon />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Section */}
          <div className="py-16 text-center">
            <p className="text-slate-500 text-sm mb-8">Trusted by thousands of renters</p>
            <div className="flex items-center justify-center gap-8 opacity-60">
              <div className="h-8 w-24 bg-slate-200 rounded"></div>
              <div className="h-8 w-24 bg-slate-200 rounded"></div>
              <div className="h-8 w-24 bg-slate-200 rounded"></div>
              <div className="h-8 w-24 bg-slate-200 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (currentPage === 'upload') {
    return (
      <div className="min-h-screen gradient-bg-modern">
        {/* Navigation */}
        <nav className="border-b border-slate-200/60 backdrop-blur-sm bg-white/80 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-slate-900 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-slate-900">LeaseWise</span>
              </div>
              <button 
                onClick={() => setCurrentPage('landing')}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200"
              >
                Back
              </button>
            </div>
          </div>
        </nav>

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
                className={`block border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                  uploadedFile 
                    ? 'border-slate-900 bg-slate-50/50' 
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
                }`}
              >
                <Upload className={`h-12 w-12 mx-auto mb-4 ${uploadedFile ? 'text-slate-900' : 'text-slate-400'}`} />
                <p className="text-lg font-medium text-slate-900 mb-2">
                  {uploadedFile ? uploadedFile.name : 'Click to upload PDF'}
                </p>
                <p className="text-sm text-slate-500">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
                    ? 'Maximum file size: 50MB (direct Supabase upload)' 
                    : 'Maximum file size: 4MB (direct upload)'}
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
                disabled={!address || !uploadedFile || isAnalyzing || uploadProgress < 100}
                className="w-full px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold text-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-lg"
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing your lease...
                  </span>
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
      </div>
    );
  }

  if (!analysisResult) return null;

  return (
    <div className="min-h-screen gradient-bg-modern">
      {/* Navigation */}
      <nav className="border-b border-slate-200/60 backdrop-blur-sm bg-white/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-slate-900 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900">LeaseWise</span>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href="/dashboard"
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </a>
              <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
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
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">Lease Analysis Complete</h1>
          <p className="text-xl text-slate-600">{address}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-sm font-medium text-slate-500 mb-2">Monthly Rent</div>
            <div className="text-3xl font-bold text-slate-900">{analysisResult.summary.monthlyRent}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-sm font-medium text-slate-500 mb-2">Security Deposit</div>
            <div className="text-3xl font-bold text-slate-900">{analysisResult.summary.securityDeposit}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-sm font-medium text-slate-500 mb-2">Lease Start</div>
            <div className="text-2xl font-bold text-slate-900">{analysisResult.summary.leaseStart}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-sm font-medium text-slate-500 mb-2">Lease End</div>
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

        {/* Rights Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 mb-8">
          <div className="border-b border-slate-200/60 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Your Rights</h2>
            </div>
          </div>
          <div className="divide-y divide-slate-200/60">
            {analysisResult.rights.map((right, i) => (
              <div key={i} className="px-6 py-5 hover:bg-slate-50/50 transition-colors duration-200">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 mb-1">{right.right}</p>
                    {right.law && (
                      <p className="text-sm text-slate-500">{right.law}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                        <p className="font-semibold text-slate-900">{date.event}</p>
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

        {/* Market Analysis */}
        {analysisResult.marketComparison && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
            <div className="border-b border-slate-200/60 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Market Analysis</h2>
              </div>
            </div>
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-600">Rent Percentile</span>
                <span className="text-lg font-bold text-slate-900">{analysisResult.marketComparison.rentPercentile}th</span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-slate-900 transition-all duration-500"
                  style={{ width: `${analysisResult.marketComparison.rentPercentile}%` }}
                />
              </div>
              <p className="text-slate-600 leading-relaxed">{analysisResult.marketComparison.rentAnalysis}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}