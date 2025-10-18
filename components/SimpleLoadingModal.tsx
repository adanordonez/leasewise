'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Upload, FileText, Brain, Flag, Scale, Cog } from 'lucide-react';
import { useEffect, useRef } from 'react';
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
  
  console.log('🔍 SimpleLoadingModal render:', { isOpen, progress, stage, logsLength: logs.length });
  
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
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
            <h2 className="text-3xl font-bold text-slate-900 mb-3">{t('LoadingModal.title')}</h2>
            <p className="text-lg text-slate-600 font-medium">
              {stage}
            </p>
          </div>

          {/* Progress Bar */}
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

          {/* Activity Cards - Scrollable */}
          <div className="px-8 pb-8">
            <div 
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
            </div>
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
