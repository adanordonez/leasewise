'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Upload, FileText, Brain, Flag, Scale, Cog } from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';

interface SimpleLoadingModalProps {
  isOpen: boolean;
  progress: number;
  stage: string;
  logs: string[];
}

export default function SimpleLoadingModal({ 
  isOpen, 
  progress, 
  stage,
  logs 
}: SimpleLoadingModalProps) {
  const t = useTranslations();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showFinalizingState, setShowFinalizingState] = useState(false);
  const [showExtraWaitMessage, setShowExtraWaitMessage] = useState(false);
  const finalizingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  console.log('🔍 SimpleLoadingModal render:', { isOpen, progress, stage, logsLength: logs.length });
  
  // Trigger finalizing state at 85% progress
  useEffect(() => {
    if (progress >= 85 && !showFinalizingState) {
      setShowFinalizingState(true);
      // Start timer for "just a few more seconds" message after 20 seconds
      finalizingTimerRef.current = setTimeout(() => {
        setShowExtraWaitMessage(true);
      }, 20000); // 20 seconds
    } else if (progress < 85 && showFinalizingState) {
      setShowFinalizingState(false);
      setShowExtraWaitMessage(false);
      if (finalizingTimerRef.current) {
        clearTimeout(finalizingTimerRef.current);
        finalizingTimerRef.current = null;
      }
    }
    
    // Cleanup timer on unmount
    return () => {
      if (finalizingTimerRef.current) {
        clearTimeout(finalizingTimerRef.current);
      }
    };
  }, [progress, showFinalizingState]);
  
  // Extract insights from logs for the finalizing state
  const extractedInsights = useMemo(() => {
    const insightKeys: string[] = [];
    logs.forEach(log => {
      if (log.includes('Extract') || log.includes('text') || log.includes('Extraer') || log.includes('texto')) {
        insightKeys.push('documentExtracted');
      }
      if (log.includes('red flag') || log.includes('señales de alerta')) {
        insightKeys.push('issuesIdentified');
      }
      if (log.includes('rights') || log.includes('obligations') || log.includes('derechos') || log.includes('obligaciones')) {
        insightKeys.push('rightsAnalyzed');
      }
      if (log.includes('clause') || log.includes('cláusula')) {
        insightKeys.push('clausesReviewed');
      }
      if (log.includes('RAG')) {
        insightKeys.push('aiComplete');
      }
    });
    // Remove duplicates and translate
    const uniqueKeys = [...new Set(insightKeys)].slice(0, 4);
    return uniqueKeys.map(key => t(`LoadingModal.insights.${key}`));
  }, [logs, t]);
  
  // Prevent background scrolling when modal is open (with scroll position preservation)
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Apply position fixed to body to prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll'; // Prevent layout shift from scrollbar
      
      // If there's a scrollbar, add padding to prevent content shift
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      // Cleanup function to restore scrolling when modal closes
      return () => {
        // Get the scroll position from the negative top value
        const scrollY = document.body.style.top;
        
        // Remove all the styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflowY = '';
        document.body.style.paddingRight = '';
        
        // Restore the scroll position
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      };
    }
  }, [isOpen]);
  
  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (scrollContainerRef.current && logs.length > 0) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs]);
  
  if (!isOpen) {
    console.log('❌ Modal not open, returning null');
    return null;
  }
  
  console.log('✅ Modal is open, rendering...');

  // Map logs to icons
  const getLogIcon = (log: string) => {
    if (log.includes('Upload')) return <Upload className="w-4 h-4" />;
    if (log.includes('Extract') || log.includes('text')) return <FileText className="w-4 h-4" />;
    if (log.includes('RAG') || log.includes('analysis')) return <Brain className="w-4 h-4" />;
    if (log.includes('red flags')) return <Flag className="w-4 h-4" />;
    if (log.includes('rights') || log.includes('obligations')) return <Scale className="w-4 h-4" />;
    return <Cog className="w-4 h-4" />;
  };

  // Clean log text by removing emojis and extra characters
  const cleanLogText = (log: string) => {
    return log.replace(/^[📤✅📄🔍🧠🚩⚖️📊🎉]/, '').trim();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      data-testid="loading-modal"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg mx-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-8 py-8 text-center">
            <AnimatePresence mode="wait">
              {showFinalizingState ? (
                <motion.div
                  key="finalizing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-6"
                >
                  <h2 className="text-4xl font-bold text-slate-900">
                    {t('LoadingModal.finalizingTitle')}
                  </h2>
                  
                  {/* Extra wait message after 20 seconds */}
                  {showExtraWaitMessage && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-lg text-purple-600 font-medium"
                    >
                      {t('LoadingModal.justAFewMore')}
                    </motion.p>
                  )}
                  
                  {/* Fast Spinning Circle */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16"
                  >
                    <svg className="w-full h-full" viewBox="0 0 50 50">
                      <circle
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="4"
                      />
                      <circle
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="80 40"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#9333ea" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-3xl font-bold text-slate-900 mb-3">{t('LoadingModal.title')}</h2>
                  <p className="text-lg text-slate-600 font-medium">
                    {stage}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress Bar - Hide during finalizing state */}
          {!showFinalizingState && (
            <div className="px-8 pb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-slate-700">
                  {t('LoadingModal.progress')}
                </span>
                <span className="text-sm font-bold text-purple-600">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Activity Cards - Scrollable */}
          <div className="px-8 pb-8">
            <AnimatePresence mode="wait">
              {showFinalizingState && extractedInsights.length > 0 ? (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-center space-y-2"
                >
                  {extractedInsights.map((insight, index) => (
                    <motion.p
                      key={insight}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.15 }}
                      className="text-sm text-slate-600"
                    >
                      ✓ {insight}
                    </motion.p>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  ref={scrollContainerRef}
                  className="max-h-80 overflow-y-auto space-y-3 pr-2 scroll-smooth"
                >
                  {logs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-50 rounded-xl p-4 border border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 leading-5">
                            {cleanLogText(log)}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-slate-400">
                          {getLogIcon(log)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center font-medium">
              {t('LoadingModal.footerMessage')}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
